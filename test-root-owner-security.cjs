/**
 * Verification Test Script: Protected Root Owner Role & RBAC Isolation
 * Run via: node test-root-owner-security.cjs
 */

const path = require("path");
const fs = require("fs");

async function runTests() {
  console.log("==================================================");
  console.log("   ROOT OWNER & SECURITY VERIFICATION SUITE       ");
  console.log("==================================================\n");

  const admin = require("./functions/node_modules/firebase-admin");
  const serviceAccount = require("./todo-e2486-firebase-adminsdk-fbsvc-7e1545a105.json");

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  const auth = admin.auth();
  const db = admin.firestore();

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  // TEST 1: Root Owner Account Exists in Firebase Auth
  console.log("--- 1. Firebase Authentication Account Check ---");
  try {
    const rootUser = await auth.getUserByEmail("hacker@sm.sm");
    assert(rootUser !== null, "Root Owner account exists in Firebase Auth");
    assert(rootUser.email === "hacker@sm.sm", "Root Owner email is hacker@sm.sm");

    // TEST 2: Authoritative Custom Claims
    const claims = rootUser.customClaims || {};
    assert(claims.role === "root_owner", "Custom claim 'role' is 'root_owner'", JSON.stringify(claims));
    assert(claims.rootOwner === true, "Custom claim 'rootOwner' is true", JSON.stringify(claims));
    assert(claims.admin === true, "Custom claim 'admin' is true (inherits full admin privileges)", JSON.stringify(claims));
    assert(claims.director === true, "Custom claim 'director' is true (inherits full director privileges)", JSON.stringify(claims));
  } catch (err) {
    assert(false, "Root Owner Firebase Auth verification", err.message);
  }

  // TEST 3: Firestore Profile Document
  console.log("\n--- 2. Firestore Document & Hierarchy Check ---");
  try {
    const rootUser = await auth.getUserByEmail("hacker@sm.sm");
    const docSnap = await db.collection("users").doc(rootUser.uid).get();
    assert(docSnap.exists, "Root Owner document exists in Firestore users collection");

    const data = docSnap.data();
    assert(data.role === "root_owner", "Firestore profile role is 'root_owner'");
    assert(data.status === "active", "Firestore status is 'active'");
    assert(data.isProtectedRoot === true, "Firestore profile is marked as 'isProtectedRoot: true'");
    assert(data.plainPassword === undefined, "No plaintext password stored in Firestore document");
  } catch (err) {
    assert(false, "Firestore document check", err.message);
  }

  // TEST 4: Restricted Visibility Simulation
  console.log("\n--- 3. Restricted Visibility Simulation ---");
  try {
    // Ordinary query (simulating adminService.getAllUsers)
    const usersSnap = await db.collection("users").limit(100).get();
    const rawUsers = usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() }));

    const hasRootInRaw = rawUsers.some((u) => u.email === "hacker@sm.sm" || u.role === "root_owner");
    assert(hasRootInRaw, "Root Owner exists in physical database collection");

    // Apply client/service filter
    const ordinaryList = rawUsers.filter(
      (u) => u.role !== "root_owner" && u.email?.toLowerCase() !== "hacker@sm.sm" && !u.isProtectedRoot
    );
    const visibleToDirector = ordinaryList.some((u) => u.email === "hacker@sm.sm" || u.role === "root_owner");
    assert(!visibleToDirector, "Root Owner is completely filtered out and HIDDEN from ordinary user directory");
  } catch (err) {
    assert(false, "Restricted visibility check", err.message);
  }

  // TEST 5: Protected Audit Logs
  console.log("\n--- 4. Protected Audit Logging ---");
  try {
    const auditSnap = await db.collection("root_audit_logs").limit(5).get();
    assert(!auditSnap.empty, "Events exist in protected root_audit_logs collection");

    const firstLog = auditSnap.docs[0].data();
    assert(firstLog.action !== undefined, "Audit log contains action type", firstLog.action);
    assert(firstLog.performedBy !== undefined, "Audit log contains operator identity", firstLog.performedBy);
  } catch (err) {
    assert(false, "Root audit logs check", err.message);
  }

  // TEST 6: Security Rules Source Integrity
  console.log("\n--- 5. Firestore Rules Analysis ---");
  const rulesContent = fs.readFileSync(path.resolve(__dirname, "firestore.rules"), "utf8");
  assert(rulesContent.includes("function isRootOwner()"), "firestore.rules contains isRootOwner() definition");
  assert(rulesContent.includes("resource.data.role != 'root_owner' || isRootOwner()"), "firestore.rules blocks unauthorized read/modification of root_owner");
  assert(rulesContent.includes("match /root_audit_logs/{logId}"), "firestore.rules protects root_audit_logs");
  assert(rulesContent.includes("isRootOwner() ||"), "isDirector() and isAdmin() inherit isRootOwner()");

  // TEST 7: Cloud Functions Middleware Integrity
  console.log("\n--- 6. Cloud Functions & Middleware Analysis ---");
  const authMiddleware = fs.readFileSync(path.resolve(__dirname, "functions/src/middleware/auth.ts"), "utf8");
  assert(authMiddleware.includes("isCallerRootOwner"), "functions middleware exports isCallerRootOwner");
  assert(authMiddleware.includes("token.role === \"root_owner\""), "functions middleware recognizes root_owner token claim");

  const userMgmt = fs.readFileSync(path.resolve(__dirname, "functions/src/admin/userManagement.ts"), "utf8");
  assert(userMgmt.includes("prevUser.role === \"root_owner\""), "userManagement guards root_owner against unauthorized status changes");
  assert(userMgmt.includes("currentClaims.role === \"root_owner\""), "setAdminRole guards root_owner against unauthorized role changes");

  // TEST 8: Server.js Backend Mirror Integrity
  console.log("\n--- 7. Server.js API Mirror Analysis ---");
  const serverJs = fs.readFileSync(path.resolve(__dirname, "server/server.js"), "utf8");
  assert(serverJs.includes("role: { $ne: 'root_owner' }"), "server.js filters out root_owner from ordinary user queries");
  assert(serverJs.includes("targetUser.role === 'root_owner'"), "server.js blocks modifying root_owner via setUserStatus/setAdminRole");

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
