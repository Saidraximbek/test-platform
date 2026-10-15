const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fargoniy_lms';
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '..', 'firebase_backup');

async function seed() {
  console.log('Connecting to MongoDB at', MONGO_URI);
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();
  console.log('Connected! Starting data migration from', BACKUP_DIR);

  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json') && f !== 'auth_export.json' && f !== 'auth_users.json');

  for (const file of files) {
    const colName = path.basename(file, '.json');
    const filePath = path.join(BACKUP_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const docs = JSON.parse(content);

    if (!Array.isArray(docs) || docs.length === 0) {
      console.log(`Skipping ${colName}: empty or not an array`);
      continue;
    }

    const col = db.collection(colName);
    console.log(`Migrating ${colName}: ${docs.length} documents...`);

    // Special handling for users collection: prepare initial password hash
    if (colName === 'users') {
      for (const u of docs) {
        const input = (u.email || u.login || u.uid || '').toLowerCase();
        const username = input.includes('@') ? input.split('@')[0] : input;

        let rawPass = username;
        if (u.role === 'admin') rawPass = 'admin';
        else if (u.role === 'director') rawPass = 'director';
        else if (u.role === 'teacher') rawPass = username || 'teacher123';
        else if (u.role === 'student') rawPass = username;

        if (!rawPass || rawPass.length < 4) rawPass = '123456';

        u.passwordHash = await bcrypt.hash(rawPass, 10);
        u.plainPassword = rawPass;
      }
    }

    // Upsert each document by _id
    for (const doc of docs) {
      const docId = doc._id || doc.id || doc.uid;
      if (!docId) continue;
      doc._id = docId;
      await col.replaceOne({ _id: docId }, doc, { upsert: true });
    }
    console.log(`✓ Completed ${colName}`);
  }

  // Create indexes for fast queries
  await db.collection('users').createIndex({ email: 1 });
  await db.collection('users').createIndex({ login: 1 });
  await db.collection('questions').createIndex({ subjectId: 1, levelId: 1 });
  await db.collection('test_sessions').createIndex({ userId: 1 });
  await db.collection('groups').createIndex({ teacherId: 1 });

  console.log('=== ALL DATA SUCCESSFULLY IMPORTED INTO MONGODB ===');
  await client.close();
}

seed().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
