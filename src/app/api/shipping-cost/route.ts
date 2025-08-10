import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../firebase';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { subtotal } = await request.json();

    // Get the most recent shipping cost from Firestore
    const shippingCostsRef = collection(db, 'shippingCosts');
    const q = query(shippingCostsRef, orderBy('updatedAt', 'desc'), limit(1));
    const snapshot = await getDocs(q);

    let shippingCost = 0;
    if (!snapshot.empty) {
      const costData = snapshot.docs[0].data();
      shippingCost = costData.cost || 0;
    }

    return NextResponse.json({ 
      shippingCost,
      subtotal,
      total: subtotal + shippingCost
    });
  } catch (error) {
    console.error('Error fetching shipping cost:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping cost' },
      { status: 500 }
    );
  }
}
