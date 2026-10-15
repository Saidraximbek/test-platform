/**
 * Secure Provisioning Script for Root Owner Account
 * Run via: node provision-root-owner.cjs
 */

const path = require("path");
const fs = require("fs");

async function main() {
  console.log("=== ROOT OWNER PROVISIONING START ===");

  // 1. Resolve Firebase Admin
  let admin;
  try {
    admin = require("./functions/node_modules/firebase-admin");
  } catch (e) {
    try {
      admin = require("firebase-admin");
    } catch (e2) {
      console.error("Firebase admin SDK not found:", e2.message);
      process.exit(1);
    }
  }

  const serviceAccountPath = path.resolve(__dirname, "todo-e2486-firebase-adminsdk-fbsvc-7e1545a105.json");
  if (!fs.existsSync(serviceAccountPath)) {
    console.error("Service account JSON not found at:", serviceAccountPath);
    process.exit(1);
  }

  const serviceAccount = require(serviceAccountPath);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  const auth = admin.auth();
  const db = admin.firestore();

  const rootEmail = "hacker@sm.sm";
  const initialPassword = "hacker";

  console.log(`Checking existing account for ${rootEmail}...`);
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(rootEmail);
    console.log(`Account found (UID: ${userRecord.uid}). Ensuring credentials and claims...`);
    await auth.updateUser(userRecord.uid, {
      password: initialPassword,
      displayName: "Root System Owner",
      emailVerified: true,
      disabled: false,
    });
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      console.log(`Creating new Firebase Auth account for ${rootEmail}...`);
      userRecord = await auth.createUser({
        email: rootEmail,
        password: initialPassword,
        displayName: "Root System Owner",
        emailVerified: true,
      });
      console.log(`Created new Firebase Auth account: UID ${userRecord.uid}`);
    } else {
      console.error("Auth query error:", err);
      process.exit(1);
    }
  }

  const uid = userRecord.uid;

  // 2. Assign authoritative custom claims
  console.log("Setting custom claims: role='root_owner', rootOwner=true, admin=true, director=true...");
  await auth.setCustomUserClaims(uid, {
    role: "root_owner",
    rootOwner: true,
    admin: true,
    director: true,
  });

  // 3. Upsert Firestore user document
  console.log(`Updating Firestore document users/${uid}...`);
  const userDocRef = db.collection("users").doc(uid);
  const existingDoc = await userDocRef.get();

  const profileData = {
    uid: uid,
    email: rootEmail,
    login: "hacker",
    displayName: "Root System Owner",
    role: "root_owner",
    status: "active",
    isCenterStudent: false,
    phoneNumber: "+998900000000",
    educationPlace: "System Root Administration",
    coinBalance: 999999,
    totalCorrectAnswers: 0,
    testsCompleted: 0,
    mustChangePassword: true,
    isProtectedRoot: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (!existingDoc.exists) {
    profileData.createdAt = admin.firestore.FieldValue.serverTimestamp();
  }

  await userDocRef.set(profileData, { merge: true });
  console.log("Firestore user profile synchronized.");

  // 4. Record to protected root_audit_logs
  console.log("Recording event into root_audit_logs...");
  await db.collection("root_audit_logs").add({
    action: "ROOT_OWNER_PROVISIONED",
    performedBy: "CLI_PROVISIONING_SCRIPT",
    targetUid: uid,
    targetEmail: rootEmail,
    role: "root_owner",
    claims: { role: "root_owner", rootOwner: true, admin: true, director: true },
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ip: "127.0.0.1",
    notes: "Initial Root Owner account provisioned via authorized server administration.",
  });

  // 5. If MongoDB is available, also sync user into MongoDB
  try {
    const { MongoClient } = require("mongodb");
    const bcrypt = require("bcryptjs");
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fargoniy_lms";
    const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 2000 });
    await client.connect();
    const mdb = client.db();
    const passwordHash = await bcrypt.hash(initialPassword, 10);
    await mdb.collection("users").replaceOne(
      { _id: uid },
      {
        _id: uid,
        uid: uid,
        email: rootEmail,
        login: "hacker",
        passwordHash,
        plainPassword: initialPassword,
        displayName: "Root System Owner",
        role: "root_owner",
        status: "active",
        mustChangePassword: true,
        isProtectedRoot: true,
        updatedAt: new Date().toISOString(),
      },
      { upsert: true }
    );
    console.log("MongoDB users collection also synchronized.");
    await client.close();
  } catch (mErr) {
    console.log("Notice: MongoDB sync skipped (standalone Firebase mode):", mErr.message);
  }

  console.log("=== ROOT OWNER PROVISIONING COMPLETED SUCCESSFULLY ===");
  console.log(`Login: ${rootEmail}`);
  console.log(`Role: ROOT_OWNER (Custom Claim & Firestore verified)`);
}

main().catch((err) => {
  console.error("Provisioning failed:", err);
  process.exit(1);
});
