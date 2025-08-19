import { NextResponse } from 'next/server';
import { db } from '@/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export async function GET() {
  try {
    // Get all products and their SKUs
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('sku'));
    const snapshot = await getDocs(q);
    
    const existingSKUs = snapshot.docs
      .map(doc => {
        const data = doc.data();
        return data.sku ? parseInt(data.sku) : null;
      })
      .filter((sku): sku is number => sku !== null && !isNaN(sku))
      .sort((a, b) => a - b);
    
    if (existingSKUs.length === 0) {
      return NextResponse.json({ nextSKU: 1 });
    }
    
    // Find the first gap in the sequence, or use the next number after the highest
    let nextSKU = 1;
    for (const sku of existingSKUs) {
      if (sku !== nextSKU) {
        break;
      }
      nextSKU++;
    }
    
    return NextResponse.json({ 
      nextSKU,
      existingSKUs: existingSKUs.slice(0, 10) // Return first 10 for debugging
    });

  } catch (error) {
    console.error('Error getting next available SKU:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
