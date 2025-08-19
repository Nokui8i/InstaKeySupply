import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get('sku');

    if (!sku) {
      return NextResponse.json({ error: 'SKU parameter is required' }, { status: 400 });
    }

    // Check if SKU already exists
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('sku', '==', sku));
    const snapshot = await getDocs(q);

    const isAvailable = snapshot.empty; // SKU is available if no products found

    return NextResponse.json({ 
      isAvailable,
      message: isAvailable ? 'SKU is available' : 'SKU already exists'
    });

  } catch (error) {
    console.error('Error checking SKU:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
