import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export interface ShippingCost {
  id: string;
  cost: number;
  updatedAt: any;
}

/**
 * Get the current shipping cost
 */
export async function getShippingCost(): Promise<number> {
  try {
    const q = query(
      collection(db, 'shippingCosts'),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return 0;

    const doc = snapshot.docs[0];
    return doc.data().cost || 0;
  } catch (error) {
    console.error('Error getting shipping cost:', error);
    return 0;
  }
}
