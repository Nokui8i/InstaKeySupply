const admin = require("firebase-admin");

// Load your service account key
const serviceAccount = require("./serviceAccountKey.json");

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Use the correct admin user's UID as provided
const uid = "SwNJuzJs8VeL2LPRIZIG7iqtO4d2";

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log("Admin claim set for user:", uid);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error setting admin claim:", error);
    process.exit(1);
  }); 