import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

export interface ShippingCost {
  id: string;
  name: string;
  minOrderAmount: number;
  maxOrderAmount?: number;
  cost: number;
  description: string;
  isActive: boolean;
  priority: number;
  regions?: string[];
}

export interface ShippingCalculation {
  cost: number;
  name: string;
  description: string;
  appliedRule: ShippingCost;
}

/**
 * Calculate shipping cost based on order amount and region
 */
export async function calculateShippingCost(
  orderAmount: number,
  region?: string
): Promise<ShippingCalculation | null> {
  try {
    // Get all active shipping costs, ordered by priority
    const q = query(
      collection(db, 'shippingCosts'),
      where('isActive', '==', true),
      orderBy('priority', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const shippingCosts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ShippingCost[];

    // Find the first applicable shipping cost
    for (const shippingCost of shippingCosts) {
      // Check if order amount is within range
      if (orderAmount < shippingCost.minOrderAmount) {
        continue;
      }
      
      if (shippingCost.maxOrderAmount && orderAmount > shippingCost.maxOrderAmount) {
        continue;
      }

      // Check if region is applicable
      if (shippingCost.regions && shippingCost.regions.length > 0) {
        if (!region || !shippingCost.regions.includes(region)) {
          continue;
        }
      }

      // This shipping cost applies
      return {
        cost: shippingCost.cost,
        name: shippingCost.name,
        description: shippingCost.description,
        appliedRule: shippingCost
      };
    }

    // No applicable shipping cost found
    return null;
  } catch (error) {
    console.error('Error calculating shipping cost:', error);
    return null;
  }
}

/**
 * Get all shipping costs for display
 */
export async function getAllShippingCosts(): Promise<ShippingCost[]> {
  try {
    const q = query(
      collection(db, 'shippingCosts'),
      where('isActive', '==', true),
      orderBy('priority', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ShippingCost[];
  } catch (error) {
    console.error('Error getting shipping costs:', error);
    return [];
  }
}

/**
 * Get shipping cost by ID
 */
export async function getShippingCostById(id: string): Promise<ShippingCost | null> {
  try {
    const q = query(
      collection(db, 'shippingCosts'),
      where('__name__', '==', id),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as ShippingCost;
  } catch (error) {
    console.error('Error getting shipping cost by ID:', error);
    return null;
  }
}
