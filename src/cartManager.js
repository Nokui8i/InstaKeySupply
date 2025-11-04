// cartManager.js
import { db, auth } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// ======== Local Storage (Guest Users) ========
function loadCartFromLocal() {
  const cart = localStorage.getItem('guestCart');
  return cart ? JSON.parse(cart) : [];
}

function saveCartToLocal(cartItems) {
  localStorage.setItem('guestCart', JSON.stringify(cartItems));
}

function clearLocalCart() {
  localStorage.removeItem('guestCart');
}

// ======== Firebase (Logged-in Users) ========
async function loadCartFromFirebase(userId) {
  const cartDoc = await getDoc(doc(db, 'userCarts', userId));
  return cartDoc.exists() ? cartDoc.data().items || [] : [];
}

// Helper function to remove undefined values from objects
function removeUndefined(obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item));
  } else if (obj !== null && typeof obj === 'object') {
    const cleaned = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        cleaned[key] = removeUndefined(obj[key]);
      }
    }
    return cleaned;
  }
  return obj;
}

async function saveCartToFirebase(userId, cartItems) {
  // Remove undefined values from cart items before saving to Firestore
  const cleanedItems = removeUndefined(cartItems);
  
  await setDoc(doc(db, 'userCarts', userId), { 
    items: cleanedItems,
    updatedAt: new Date().toISOString(),
    userId: userId
  }, { merge: true });
}

// ======== Main Cart Manager ========
let globalCartUpdateCallback = null;

export async function initCart(onCartUpdate) {
  let currentCart = [];
  let isInitialized = false;
  let lastUpdateTime = 0;
  let updateTimeout = null;
  
  // Store the callback globally so cart actions can trigger updates
  globalCartUpdateCallback = onCartUpdate;
  
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // Merge guest cart if exists
      const guestCart = loadCartFromLocal();
      if (guestCart.length > 0) {
        const firebaseCart = await loadCartFromFirebase(user.uid);
        const merged = mergeCarts(firebaseCart, guestCart);
        await saveCartToFirebase(user.uid, merged);
        clearLocalCart();
        currentCart = merged;
        onCartUpdate(merged);
        isInitialized = true;
      } else {
        // Load existing Firebase cart
        const firebaseCart = await loadCartFromFirebase(user.uid);
        currentCart = firebaseCart;
        onCartUpdate(firebaseCart);
        isInitialized = true;
      }

      // Listen to Firebase cart changes in real-time
      listenToFirebaseCart(user.uid, (newCart) => {
        const now = Date.now();
        
        // Prevent immediate overrides by checking if this is a legitimate change
        if (now - lastUpdateTime > 1000) { // 1 second buffer
          // Only update if the cart actually changed and we're not in the middle of an operation
          if (JSON.stringify(newCart) !== JSON.stringify(currentCart)) {
            currentCart = newCart;
            onCartUpdate(newCart);
          }
        }
      });

    } else {
      // Load from local storage
      const localCart = loadCartFromLocal();
      currentCart = localCart;
      onCartUpdate(localCart);
      isInitialized = true;
      
      // Listen to localStorage changes for guest users
      window.addEventListener('storage', (e) => {
        if (e.key === 'guestCart') {
          const newCart = e.newValue ? JSON.parse(e.newValue) : [];
          if (JSON.stringify(newCart) !== JSON.stringify(currentCart)) {
            currentCart = newCart;
            onCartUpdate(newCart);
          }
        }
      });
    }
  });
}

// Helper function to trigger cart update after local operations
function triggerCartUpdate() {
  if (globalCartUpdateCallback) {
    const user = auth.currentUser;
    if (user) {
      // For logged-in users, manually trigger update to avoid onSnapshot delay
      loadCartFromFirebase(user.uid).then(cart => {
        globalCartUpdateCallback(cart);
      }).catch(err => {
        console.error('Error loading cart for update:', err);
      });
    } else {
      // For guest users, read from localStorage and update
      const localCart = loadCartFromLocal();
      globalCartUpdateCallback(localCart);
    }
  }
}

// ======== Cart Actions ========
export async function addToCart(item) {
  const user = auth.currentUser;
  if (user) {
    const firebaseCart = await loadCartFromFirebase(user.uid);
    const updatedCart = mergeCarts(firebaseCart, [item]);
    await saveCartToFirebase(user.uid, updatedCart);
    // Trigger immediate update (onSnapshot has a 1 second buffer)
    triggerCartUpdate();
  } else {
    const localCart = loadCartFromLocal();
    const updatedCart = mergeCarts(localCart, [item]);
    saveCartToLocal(updatedCart);
    // Trigger immediate update for guest users
    triggerCartUpdate();
  }
}

export async function removeFromCart(productId) {
  const user = auth.currentUser;
  if (user) {
    const firebaseCart = await loadCartFromFirebase(user.uid);
    const updatedCart = firebaseCart.filter(i => i.id !== productId);
    await saveCartToFirebase(user.uid, updatedCart);
    // Trigger immediate update (onSnapshot has a 1 second buffer)
    triggerCartUpdate();
  } else {
    const localCart = loadCartFromLocal();
    const updatedCart = localCart.filter(i => i.id !== productId);
    saveCartToLocal(updatedCart);
    // Trigger immediate update for guest users
    triggerCartUpdate();
  }
}

export async function clearCart() {
  const user = auth.currentUser;
  if (user) {
    await saveCartToFirebase(user.uid, []);
    // Trigger immediate update (onSnapshot has a 1 second buffer)
    triggerCartUpdate();
  } else {
    clearLocalCart();
    // Trigger immediate update for guest users
    triggerCartUpdate();
  }
}

export async function updateQuantity(productId, newQuantity) {
  const user = auth.currentUser;
  if (user) {
    const firebaseCart = await loadCartFromFirebase(user.uid);
    const updatedCart = firebaseCart.map(item => 
      item.id === productId ? { ...item, quantity: newQuantity } : item
    ).filter(item => item.quantity > 0);
    await saveCartToFirebase(user.uid, updatedCart);
    // Trigger immediate update (onSnapshot has a 1 second buffer)
    triggerCartUpdate();
  } else {
    const localCart = loadCartFromLocal();
    const updatedCart = localCart.map(item => 
      item.id === productId ? { ...item, quantity: newQuantity } : item
    ).filter(item => item.quantity > 0);
    saveCartToLocal(updatedCart);
    // Trigger immediate update for guest users
    triggerCartUpdate();
  }
}

// ======== Utility: Merge Carts & Remove Duplicates ========
function mergeCarts(cartA, cartB) {
  const merged = [...cartA];
  for (const item of cartB) {
    const existingIndex = merged.findIndex(i => i.id === item.id);
    if (existingIndex > -1) {
      merged[existingIndex].quantity += item.quantity;
    } else {
      merged.push(item);
    }
  }
  return merged;
}

function listenToFirebaseCart(userId, callback) {
  return onSnapshot(doc(db, 'userCarts', userId), (docSnap) => {
    if (docSnap.exists()) {
      const items = docSnap.data().items || [];
      callback(items);
    } else {
      callback([]);
    }
  });
}
