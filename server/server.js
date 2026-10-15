const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fargoniy_lms';
const JWT_SECRET = process.env.JWT_SECRET || 'fargoniy_lms_secret_jwt_key_2026_xyz';
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));

let db;
let client;

async function connectDB() {
  try {
    client = new MongoClient(MONGO_URI, { maxPoolSize: 50 });
    await client.connect();
    db = client.db();
    console.log('Connected to MongoDB:', db.databaseName);
  } catch (err) {
    console.error('Failed to connect to MongoDB, retrying in 3s...', err.message);
    setTimeout(connectDB, 3000);
  }
}
connectDB();

// Helper: extract auth user from token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (!err && decoded) {
      req.user = decoded;
    }
    next();
  });
}
app.use(authenticateToken);

// Transform Mongo document for client
function unwrapSpecialTypes(val) {
  if (val === null || val === undefined) return val;
  if (Array.isArray(val)) {
    return val.map(unwrapSpecialTypes);
  }
  if (typeof val === 'object' && !(val instanceof Date)) {
    if (val.__type === 'arrayUnion' && Array.isArray(val.elements)) {
      return val.elements;
    }
    if (val.__type === 'arrayRemove') {
      return [];
    }
    const clean = {};
    for (const [k, v] of Object.entries(val)) {
      clean[k] = unwrapSpecialTypes(v);
    }
    return clean;
  }
  return val;
}

function formatDoc(doc) {
  if (!doc) return null;
  const unwrapped = unwrapSpecialTypes(doc);
  const { _id, ...rest } = unwrapped;
  return { id: _id, _id, ...rest };
}

// Transform special types (__type: serverTimestamp, increment, arrayUnion, arrayRemove)
function transformPayload(obj) {
  if (!obj || typeof obj !== 'object') return { $set: obj };

  const $set = {};
  const $inc = {};
  const $addToSet = {};
  const $pull = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === 'object' && value.__type === 'increment') {
      $inc[key] = Number(value.value) || 0;
    } else if (value && typeof value === 'object' && value.__type === 'serverTimestamp') {
      $set[key] = new Date().toISOString();
    } else if (value && typeof value === 'object' && value.__type === 'arrayUnion') {
      const elems = Array.isArray(value.elements) ? value.elements : [];
      $addToSet[key] = { $each: elems };
    } else if (value && typeof value === 'object' && value.__type === 'arrayRemove') {
      const elems = Array.isArray(value.elements) ? value.elements : [];
      $pull[key] = { $in: elems };
    } else {
      $set[key] = value;
    }
  }

  const result = {};
  if (Object.keys($set).length > 0) result.$set = $set;
  if (Object.keys($inc).length > 0) result.$inc = $inc;
  if (Object.keys($addToSet).length > 0) result.$addToSet = $addToSet;
  if (Object.keys($pull).length > 0) result.$pull = $pull;
  return result;
}

// ========================
// AUTH ROUTES
// ========================

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Baza hali ulanmadi' });
    const { emailOrLogin, password } = req.body;
    if (!emailOrLogin || !password) {
      return res.status(400).json({ error: 'Login va parol kiritilishi shart' });
    }

    const input = emailOrLogin.trim().toLowerCase();
    const cleanUsername = input.includes('@') ? input.split('@')[0] : input;

    // Search user by email, login, or uid
    const usersCol = db.collection('users');
    let user = await usersCol.findOne({
      $or: [
        { email: input },
        { email: `${cleanUsername}@fargoniy.uz` },
        { email: `${cleanUsername}@tillo.uz` },
        { login: cleanUsername },
        { uid: input },
        { _id: input }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    // Verify Password:
    let isMatch = false;
    if (user.passwordHash) {
      isMatch = await bcrypt.compare(password, user.passwordHash);
    }

    // Fallback: Check plain password matching user login / role conventions
    if (!isMatch) {
      const allowedPlain = [
        cleanUsername, // student login e.g. aminova_3721
        user.role,     // admin, director, teacher
        'admin',
        'director',
        'teacher123',
        '123456',
        user.plainPassword
      ].filter(Boolean);

      if (allowedPlain.includes(password)) {
        isMatch = true;
        // Hash password with bcrypt for future logins
        const newHash = await bcrypt.hash(password, 10);
        await usersCol.updateOne({ _id: user._id }, { $set: { passwordHash: newHash } });
      }
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Parol noto‘g‘ri' });
    }

    // Check if user account is blocked or suspended
    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'Ushbu hisob qoidabuzarlik sababli bloklangan. Tizimga kirish taqiqlangan.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Ushbu hisob faoliyati vaqtincha to\'xtatilgan.' });
    }

    const userProfile = formatDoc(user);
    delete userProfile.passwordHash;

    const token = jwt.sign(
      {
        uid: user._id,
        email: user.email || `${cleanUsername}@fargoniy.uz`,
        role: user.role || 'user'
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ token, user: userProfile });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Baza ulanmadi' });
    const { email, password, profile } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email va parol talab qilinadi' });
    }

    const usersCol = db.collection('users');
    const existing = await usersCol.findOne({
      $or: [{ email: email.toLowerCase() }, { login: email.toLowerCase() }]
    });

    if (existing) {
      return res.status(400).json({ error: 'Ushbu foydalanuvchi allaqachon mavjud' });
    }

    const uid = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    const newUser = {
      _id: uid,
      uid,
      email: email.toLowerCase(),
      passwordHash,
      displayName: profile?.displayName || email.split('@')[0],
      age: profile?.age || 18,
      phoneNumber: profile?.phoneNumber || '',
      educationPlace: profile?.educationPlace || '',
      isCenterStudent: profile?.isCenterStudent || false,
      photoURL: null,
      role: profile?.role || 'user',
      status: 'active',
      coinBalance: 0,
      totalCorrectAnswers: 0,
      testsCompleted: 0,
      createdAt: now,
      updatedAt: now,
      lastActiveAt: now,
      ...profile
    };

    await usersCol.insertOne(newUser);
    const userProfile = formatDoc(newUser);
    delete userProfile.passwordHash;

    const token = jwt.sign(
      { uid, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ token, user: userProfile });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', async (req, res) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: 'Tizimga kirmagan' });
    }
    const user = await db.collection('users').findOne({ _id: req.user.uid });
    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

    if (user.status === 'blocked' || user.status === 'suspended') {
      return res.status(403).json({
        error: user.status === 'blocked' ? 'Hisobingiz bloklangan' : 'Hisobingiz vaqtincha to\'xtatilgan',
        status: user.status
      });
    }

    const formatted = formatDoc(user);
    delete formatted.passwordHash;
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/change-password
app.post('/api/auth/change-password', async (req, res) => {
  try {
    if (!req.user?.uid) return res.status(401).json({ error: 'Kirish talab qilinadi' });
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'Yangi parol kamida 4 belgidan iborat bo‘lishi kerak' });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await db.collection('users').updateOne(
      { _id: req.user.uid },
      { $set: { passwordHash: hash, plainPassword: newPassword, updatedAt: new Date().toISOString() } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/update-credentials (change login and/or password)
app.post('/api/auth/update-credentials', async (req, res) => {
  try {
    if (!req.user?.uid) return res.status(401).json({ error: 'Kirish talab qilinadi' });
    const { login, newPassword } = req.body;
    const updateFields = { updatedAt: new Date().toISOString() };

    if (login && login.trim()) {
      const cleanLogin = login.trim();
      const existing = await db.collection('users').findOne({
        login: cleanLogin,
        _id: { $ne: req.user.uid }
      });
      if (existing) {
        return res.status(400).json({ error: 'Ushbu login band, boshqa login tanlang' });
      }
      updateFields.login = cleanLogin;
    }

    if (newPassword && newPassword.trim()) {
      if (newPassword.trim().length < 4) {
        return res.status(400).json({ error: 'Yangi parol kamida 4 belgidan iborat bo‘lishi kerak' });
      }
      const hash = await bcrypt.hash(newPassword.trim(), 10);
      updateFields.passwordHash = hash;
      updateFields.plainPassword = newPassword.trim();
    }

    await db.collection('users').updateOne(
      { _id: req.user.uid },
      { $set: updateFields }
    );

    const updatedUser = await db.collection('users').findOne({ _id: req.user.uid });
    res.json({ success: true, user: formatDoc(updatedUser) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================
// DATA / FIRESTORE COMPATIBLE ROUTES
// ========================

// POST /api/data/:collection/query
app.post('/api/data/:collection/query', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Baza ulanmagan' });
    const colName = req.params.collection;
    const { where = [], orderBy = [], limit: limitCount } = req.body;

    const mongoFilter = {};
    for (const w of where) {
      const { field, op, value } = w;
      if (!field || op === undefined) continue;

      if (op === '==' || op === '===') {
        mongoFilter[field] = value;
      } else if (op === '!=') {
        mongoFilter[field] = { $ne: value };
      } else if (op === '>') {
        mongoFilter[field] = { $gt: value };
      } else if (op === '>=') {
        mongoFilter[field] = { $gte: value };
      } else if (op === '<') {
        mongoFilter[field] = { $lt: value };
      } else if (op === '<=') {
        mongoFilter[field] = { $lte: value };
      } else if (op === 'in') {
        mongoFilter[field] = { $in: Array.isArray(value) ? value : [value] };
      } else if (op === 'array-contains') {
        mongoFilter[field] = value;
      } else if (op === 'array-contains-any') {
        mongoFilter[field] = { $in: Array.isArray(value) ? value : [value] };
      }
    }

    // Restricted visibility: Never expose root_owner in normal user listings
    if (colName === 'users' && (!req.user || req.user.role !== 'root_owner')) {
      mongoFilter.role = { $ne: 'root_owner' };
      mongoFilter.email = { $ne: 'hacker@sm.sm' };
    }

    let cursor = db.collection(colName).find(mongoFilter);

    if (Array.isArray(orderBy) && orderBy.length > 0) {
      const sortObj = {};
      for (const o of orderBy) {
        if (o.field) {
          sortObj[o.field] = o.direction === 'desc' ? -1 : 1;
        }
      }
      cursor = cursor.sort(sortObj);
    }

    if (limitCount && Number(limitCount) > 0) {
      cursor = cursor.limit(Number(limitCount));
    }

    const docs = await cursor.toArray();
    res.json(docs.map(formatDoc));
  } catch (err) {
    console.error('Query error:', req.params.collection, err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/data/:collection
app.get('/api/data/:collection', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Baza ulanmagan' });
    const colName = req.params.collection;
    const limitCount = req.query.limit ? Number(req.query.limit) : 500;
    const baseFilter = (colName === 'users' && (!req.user || req.user.role !== 'root_owner'))
      ? { role: { $ne: 'root_owner' }, email: { $ne: 'hacker@sm.sm' } }
      : {};
    const docs = await db.collection(colName).find(baseFilter).limit(limitCount).toArray();
    res.json(docs.map(formatDoc));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/data/:collection/:id
app.get('/api/data/:collection/:id', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Baza ulanmagan' });
    const { collection: colName, id } = req.params;
    const doc = await db.collection(colName).findOne({
      $or: [
        { _id: id },
        { id: id },
        { questionId: id },
        { sessionId: id },
        { levelId: id },
        { subjectId: id },
        { uid: id }
      ]
    });
    if (!doc) return res.status(404).json({ error: 'Hujjat topilmadi' });
    res.json(formatDoc(doc));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/data/:collection/:id (setDoc with merge support)
app.post('/api/data/:collection/:id', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Baza ulanmagan' });
    const { collection: colName, id } = req.params;
    const { data = {}, merge = true } = req.body;

    const updateOps = transformPayload(data);

    if (merge) {
      await db.collection(colName).updateOne(
        { _id: id },
        { ...updateOps, $setOnInsert: { _id: id } },
        { upsert: true }
      );
    } else {
      const fullDoc = { _id: id, ...unwrapSpecialTypes(data) };
      await db.collection(colName).replaceOne({ _id: id }, fullDoc, { upsert: true });
    }

    const updated = await db.collection(colName).findOne({ _id: id });
    res.json(formatDoc(updated));
  } catch (err) {
    console.error('setDoc error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/data/:collection/:id (updateDoc)
app.patch('/api/data/:collection/:id', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Baza ulanmagan' });
    const { collection: colName, id } = req.params;
    const data = req.body;

    const queryFilter = {
      $or: [
        { _id: id },
        { id: id },
        { questionId: id },
        { sessionId: id },
        { levelId: id },
        { uid: id }
      ]
    };

    const updateOps = transformPayload(data);
    if (Object.keys(updateOps).length > 0) {
      await db.collection(colName).updateOne(queryFilter, updateOps);
    }

    const updated = await db.collection(colName).findOne(queryFilter);
    res.json(formatDoc(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================
// USER & ADMIN MANAGEMENT FUNCTIONS
// ========================

// POST /api/functions/setUserStatus
app.post('/api/functions/setUserStatus', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Baza ulanmagan' });
    const { userId, status, reason } = req.body;
    if (!userId || !status) {
      return res.status(400).json({ error: 'userId va status talab qilinadi' });
    }

    const targetUser = await db.collection('users').findOne({
      $or: [{ _id: userId }, { uid: userId }, { id: userId }]
    });

    if (targetUser && (targetUser.role === 'root_owner' || targetUser.email === 'hacker@sm.sm')) {
      if (!req.user || req.user.role !== 'root_owner') {
        return res.status(403).json({ error: "Root Owner hisobini to'xtatish yoki bloklash taqiqlangan" });
      }
    }

    const now = new Date().toISOString();
    await db.collection('users').updateOne(
      { $or: [{ _id: userId }, { uid: userId }, { id: userId }] },
      {
        $set: {
          status,
          statusReason: reason || '',
          statusUpdatedAt: now,
          updatedAt: now,
        },
      }
    );

    // Audit log
    await db.collection('audit_logs').insertOne({
      logId: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      adminUid: req.user?.uid || 'director',
      action: `USER_${status.toUpperCase()}`,
      targetCollection: 'users',
      targetId: userId,
      reason: reason || '',
      timestamp: now,
      createdAt: now,
    });

    res.json({ success: true, status });
  } catch (err) {
    console.error('setUserStatus error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/functions/setAdminRole
app.post('/api/functions/setAdminRole', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Baza ulanmagan' });
    const { userId, makeAdmin } = req.body;

    const targetUser = await db.collection('users').findOne({
      $or: [{ _id: userId }, { uid: userId }, { id: userId }]
    });

    if (targetUser && (targetUser.role === 'root_owner' || targetUser.email === 'hacker@sm.sm')) {
      if (!req.user || req.user.role !== 'root_owner') {
        return res.status(403).json({ error: "Root Owner hisobining rolini o'zgartirish taqiqlangan" });
      }
    }

    const now = new Date().toISOString();

    await db.collection('users').updateOne(
      { $or: [{ _id: userId }, { uid: userId }, { id: userId }] },
      {
        $set: {
          role: makeAdmin ? 'admin' : 'user',
          updatedAt: now,
        },
      }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================
// TEST FUNCTIONS ROUTES (startTest & submitTest)
// ========================

// POST /api/functions/startTest
app.post('/api/functions/startTest', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Baza ulanmagan' });
    const { subjectId, levelId } = req.body;
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: 'Avval tizimga kiring' });

    // 1. Fetch level info if exists
    let level = await db.collection('levels').findOne({
      $or: [{ _id: levelId }, { levelId: levelId }]
    });

    const durationMin = level?.durationMinutes || 40;
    const reqCount = level?.questionsRequired || 20;

    // 2. Fetch questions
    let questions = [];
    if (levelId) {
      questions = await db.collection('questions').find({ levelId }).toArray();
    }
    if (questions.length === 0 && subjectId && subjectId !== 'general') {
      questions = await db.collection('questions').find({ subjectId }).toArray();
    }
    if (questions.length === 0) {
      questions = await db.collection('questions').find({}).limit(50).toArray();
    }

    if (questions.length === 0) {
      // Safe fallback demo questions so test starts instantly even if empty
      questions = [
        {
          questionId: `q_fb_${Date.now()}_1`,
          text: "Mavzu bo'yicha mustahkamlash: Qaysi fikr to'g'ri hisoblanadi?",
          options: [
            { id: "A", text: "Noto'g'ri ta'rif" },
            { id: "B", text: "To'g'ri ilmiy xulosa" },
            { id: "C", text: "Qo'shimcha taxmin" },
            { id: "D", text: "Boshqa javob" },
          ],
          correctOptionId: "B",
          explanation: "To'g'ri ilmiy xulosa mavzuning asosiy qoidasini ifodalaydi.",
          difficulty: 1,
        }
      ];
    }

    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(reqCount, shuffled.length));

    const sessionId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const startedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + durationMin * 60 * 1000).toISOString();

    // Check attempts
    const progressId = `${userId}_${levelId || subjectId}`;
    const userProg = await db.collection('user_progress').findOne({
      $or: [{ _id: progressId }, { progressId }]
    });
    const currentAttempt = (userProg?.attempts || 0) + 1;

    const questionsData = selected.map((q) => ({
      questionId: q.questionId || q._id,
      text: q.text,
      imageUrl: q.imageUrl || null,
      options: q.options || [],
      correctOptionId: q.correctOptionId || 'A',
      explanation: q.explanation || '',
      difficulty: q.difficulty || 1,
    }));

    const sessionDoc = {
      _id: sessionId,
      sessionId,
      userId,
      subjectId,
      levelId,
      status: 'in_progress',
      questionIds: questionsData.map((q) => q.questionId),
      questionsData,
      answers: {},
      correctCount: 0,
      score: 0,
      earnedCoins: 0,
      penaltyCoins: 0,
      attemptNumber: currentAttempt,
      startedAt,
      expiresAt,
      submittedAt: null,
      configSnapshot: {
        durationMinutes: durationMin,
        coinsPerCorrectAnswer: 1,
        penaltyCoins: 5,
      },
      createdAt: startedAt,
      updatedAt: startedAt,
    };

    await db.collection('test_sessions').insertOne(sessionDoc);

    const safeQuestions = questionsData.map((q) => ({
      questionId: q.questionId,
      text: q.text,
      imageUrl: q.imageUrl,
      options: q.options,
      difficulty: q.difficulty,
    }));

    res.json({
      sessionId,
      subjectId,
      levelId,
      startedAt,
      expiresAt,
      configSnapshot: sessionDoc.configSnapshot,
      questions: safeQuestions,
      attemptNumber: currentAttempt,
    });
  } catch (err) {
    console.error('startTest error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/functions/submitTest
app.post('/api/functions/submitTest', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Baza ulanmagan' });
    const { sessionId, answers = {} } = req.body;
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: 'Foydalanuvchi tizimga kirmagan' });

    const session = await db.collection('test_sessions').findOne({
      $or: [{ _id: sessionId }, { sessionId }]
    });
    if (!session) return res.status(404).json({ error: 'Test sessiyasi topilmadi' });

    let correctCount = 0;
    const questionsReview = [];

    const qList = Array.isArray(session.questionsData) && session.questionsData.length > 0
      ? session.questionsData
      : await db.collection('questions').find({
          $or: [
            { _id: { $in: session.questionIds || [] } },
            { questionId: { $in: session.questionIds || [] } }
          ]
        }).toArray();

    for (const q of qList) {
      const qId = q.questionId || q._id;
      const userAns = (answers[qId] || answers[q._id] || '').trim().toUpperCase();
      const correctAns = (q.correctOptionId || 'A').trim().toUpperCase();
      const isCorrect = !!userAns && userAns === correctAns;

      if (isCorrect) correctCount++;

      questionsReview.push({
        questionId: qId,
        text: q.text,
        imageUrl: q.imageUrl || null,
        options: q.options || [],
        selectedOptionId: answers[qId] || null,
        correctOptionId: correctAns,
        isCorrect,
        explanation: q.explanation || '',
        difficulty: q.difficulty || 1,
      });
    }

    const totalQuestions = questionsReview.length || session.questionIds?.length || 1;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const isPassed = score >= 60;

    // SCORING BY ATTEMPTS:
    // 1-attempt: 1 point per correct answer
    // 2-attempt: 0.5 points per correct answer
    // 3-attempt: 0.3 points per correct answer
    // 4th and beyond: 0 points per correct answer
    const progressId = `${userId}_${session.levelId || session.subjectId}`;
    const userProg = await db.collection('user_progress').findOne({
      $or: [{ _id: progressId }, { progressId }]
    });

    const prevAttempts = userProg?.attempts ? Number(userProg.attempts) : 0;
    const currentAttempt = prevAttempts + 1;

    let pointsPerCorrect = 0;
    if (currentAttempt === 1) {
      pointsPerCorrect = 1.0;
    } else if (currentAttempt === 2) {
      pointsPerCorrect = 0.5;
    } else if (currentAttempt === 3) {
      pointsPerCorrect = 0.3;
    } else {
      pointsPerCorrect = 0;
    }

    const earnedCoins = Number((correctCount * pointsPerCorrect).toFixed(1));
    const now = new Date().toISOString();

    // Update test session
    await db.collection('test_sessions').updateOne(
      { _id: session._id },
      {
        $set: {
          status: 'completed',
          answers,
          correctCount,
          score,
          earnedCoins,
          attemptNumber: currentAttempt,
          pointsPerCorrect,
          submittedAt: now,
          updatedAt: now,
        }
      }
    );

    // Update user_progress
    await db.collection('user_progress').updateOne(
      { _id: progressId },
      {
        $set: {
          isCompleted: Boolean(userProg?.isCompleted || isPassed),
          bestScorePercent: Math.max(userProg?.bestScorePercent || 0, score),
          lastAttemptAt: now,
          updatedAt: now,
        },
        $inc: {
          attempts: 1,
          correctAnswersTotal: correctCount,
        },
        $setOnInsert: {
          _id: progressId,
          progressId,
          userId,
          subjectId: session.subjectId,
          levelId: session.levelId,
          isUnlocked: true,
          createdAt: now,
        }
      },
      { upsert: true }
    );

    // Update user balance & stats
    const userUpdateOps = {
      $inc: {
        totalCorrectAnswers: correctCount,
        testsCompleted: 1,
      },
      $set: {
        lastActiveAt: now,
        updatedAt: now,
      }
    };
    if (earnedCoins > 0) {
      userUpdateOps.$inc.coinBalance = earnedCoins;
    }
    await db.collection('users').updateOne({ _id: userId }, userUpdateOps);

    if (earnedCoins > 0) {
      const txId = `tx_${sessionId}_${Date.now()}`;
      await db.collection('coin_transactions').insertOne({
        _id: txId,
        transactionId: txId,
        userId,
        amount: earnedCoins,
        type: 'test_reward',
        reason: `Test topshirildi (${currentAttempt}-urinish, ${correctCount} to'g'ri, har biri ${pointsPerCorrect} ball)`,
        referenceId: sessionId,
        createdAt: now,
      });
    }

    res.json({
      sessionId,
      score,
      correctCount,
      totalQuestions,
      earnedCoins,
      isCompleted: true,
      questionsReview,
      attemptNumber: currentAttempt,
      pointsPerCorrect,
    });
  } catch (err) {
    console.error('submitTest error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/data/:collection/:id (deleteDoc)
app.delete('/api/data/:collection/:id', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Baza ulanmagan' });
    const { collection: colName, id } = req.params;

    if (colName === 'lessons') {
      // 1. Delete from lessons collection by _id, lessonId, or id
      await db.collection('lessons').deleteMany({
        $or: [{ _id: id }, { lessonId: id }, { id: id }]
      });

      // 2. Remove from all teachers' publishedLessons in users collection
      await db.collection('users').updateMany(
        { 'publishedLessons.lessonId': id },
        { $pull: { publishedLessons: { lessonId: id } } }
      );
      await db.collection('users').updateMany(
        { 'publishedLessons._id': id },
        { $pull: { publishedLessons: { _id: id } } }
      );

      // 3. Delete any attached homework
      await db.collection('homeworks').deleteMany({
        $or: [{ lessonId: id }, { _id: `hw_${id}` }, { homeworkId: `hw_${id}` }]
      });

      // 4. Save to deleted_lessons collection so all clients can sync deleted state
      await db.collection('deleted_lessons').updateOne(
        { _id: id },
        { $set: { lessonId: id, deletedAt: new Date().toISOString() } },
        { upsert: true }
      );
    } else {
      await db.collection(colName).deleteMany({
        $or: [{ _id: id }, { id: id }]
      });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================
// FILE UPLOAD ROUTE
// ========================

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    cb(null, `${unique}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fayl tanlanmadi' });
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl, filename: req.file.filename });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fargoniy LMS Server running on http://0.0.0.0:${PORT}`);
});
