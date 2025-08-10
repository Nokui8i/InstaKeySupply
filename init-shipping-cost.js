const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } = require('firebase/firestore');

// Your Firebase config - replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initializeShippingCost() {
  try {
    // Check if shipping cost already exists
    const shippingCostsRef = collection(db, 'shippingCosts');
    const q = query(shippingCostsRef, orderBy('updatedAt', 'desc'), limit(1));
    const existingCosts = await getDocs(q);
    
    if (!existingCosts.empty) {
      console.log('Shipping cost already exists, skipping initialization');
      const existingCost = existingCosts.docs[0].data();
      console.log(`Current shipping cost: $${existingCost.cost}`);
      return;
    }

    // Add default shipping cost
    const defaultShippingCost = {
      cost: 5.99, // Default shipping cost of $5.99
      updatedAt: new Date(),
      description: 'Standard shipping cost for all orders',
      isActive: true
    };

    await addDoc(collection(db, 'shippingCosts'), defaultShippingCost);
    console.log('Successfully initialized default shipping cost: $5.99');
  } catch (error) {
    console.error('Error initializing shipping cost:', error);
    throw error;
  }
}

async function runShippingCostInitialization() {
  try {
    console.log('Starting shipping cost initialization...');
    await initializeShippingCost();
    console.log('Shipping cost initialization completed successfully!');
  } catch (error) {
    console.error('Shipping cost initialization failed:', error);
  }
}

// Run the initialization
runShippingCostInitialization();
