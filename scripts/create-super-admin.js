// One-time script to create the first super admin in the system
// Usage: node scripts/create-super-admin.js <email> <password>

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, setDoc, doc } = require('firebase/firestore');

// Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Check command line arguments
if (process.argv.length < 4) {
  console.error('Usage: node create-super-admin.js <email> <password>');
  process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];

async function createSuperAdmin() {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log(`Creating super admin account for ${email}...`);
    
    // Create the user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    const now = new Date();
    
    // Create the user profile in Firestore
    const userData = {
      profile: {
        uid: uid,
        email: email,
        name: 'Super Administrator',
        role: 'superadmin',
        phone: '',
        email_verified: false,
      },
      status: 'active',
      borrowCount: 0,
      timestamps: {
        created_at: now,
        last_login: now
      },
      logs: {
        created: {
          created_by: {
            uid: 'system',
            email: 'system',
            name: 'System Setup'
          },
          created_at: now
        }
      }
    };
    
    await setDoc(doc(db, 'Users', uid), userData);
    
    console.log(`Super admin created successfully!`);
    console.log(`User ID: ${uid}`);
    console.log(`Email: ${email}`);
    console.log(`Role: superadmin`);
    
  } catch (error) {
    console.error('Error creating super admin:', error);
  }
}

createSuperAdmin();