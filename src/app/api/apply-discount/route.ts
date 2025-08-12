import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase';
import { 
  collection, 
  getDocs, 
  getDoc,
  query, 
  where, 
  updateDoc, 
  doc, 
  writeBatch,
  Timestamp 
} from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const { discountId } = await req.json();

    if (!discountId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Discount ID is required' 
      }, { status: 400 });
    }

    // Get the discount details
    const discountRef = doc(db, 'discounts', discountId);
    const discountSnap = await getDoc(discountRef);
    
    if (!discountSnap.exists()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Discount not found' 
      }, { status: 404 });
    }
    
    const discount = discountSnap.data();

    if (!discount.active) {
      return NextResponse.json({ 
        success: false, 
        error: 'Discount is not active' 
      }, { status: 400 });
    }

    // Check if discount is currently valid (only if dates are set)
    const now = Timestamp.now();
    if (discount.hasStartDate && discount.startDate && discount.startDate > now) {
      return NextResponse.json({ 
        success: false, 
        error: 'Discount has not started yet' 
      }, { status: 400 });
    }
    
    if (discount.hasEndDate && discount.endDate && discount.endDate < now) {
      return NextResponse.json({ 
        success: false, 
        error: 'Discount has expired' 
      }, { status: 400 });
    }

    // Get products to apply discount to
    const productsToUpdate: string[] = [];

    // Add products from applicableProducts array
    if (discount.applicableProducts && discount.applicableProducts.length > 0) {
      productsToUpdate.push(...discount.applicableProducts);
    }

    // Add products from applicableCategories
    if (discount.applicableCategories && discount.applicableCategories.length > 0) {
      const categoryQuery = query(
        collection(db, 'products'), 
        where('categoryId', 'in', discount.applicableCategories)
      );
      const categoryProducts = await getDocs(categoryQuery);
      categoryProducts.docs.forEach(productDoc => {
        if (!productsToUpdate.includes(productDoc.id)) {
          productsToUpdate.push(productDoc.id);
        }
      });
    }

    if (productsToUpdate.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No products found to apply discount to' 
      }, { status: 400 });
    }

    // Get all products that need updating
    console.log('Products to update:', productsToUpdate);
    console.log('Products to update length:', productsToUpdate.length);
    
    // Fetch products individually to avoid query limitations
    const productsToProcess: any[] = [];
    
    for (const productId of productsToUpdate) {
      try {
        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          productsToProcess.push({
            id: productSnap.id,
            ...productSnap.data()
          });
        } else {
          console.log(`Product ${productId} not found`);
        }
      } catch (error) {
        console.error(`Error fetching product ${productId}:`, error);
      }
    }
    
    console.log('Products fetched individually:', productsToProcess.length);

    if (productsToProcess.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No products found' 
      }, { status: 404 });
    }

    // Apply discount to products
    console.log('Starting to apply discount to products...');
    const batch = writeBatch(db);
    let updatedCount = 0;

    productsToProcess.forEach((product, index) => {
      console.log(`Processing product ${index + 1}:`, product.id);
      const currentPrice = parseFloat(product.price) || 0;
      
      console.log(`Product ${product.id} price:`, currentPrice);
      
      if (currentPrice <= 0) {
        console.log(`Skipping product ${product.id} - no price`);
        return;
      }

      let discountedPrice = currentPrice;
      let discountAmount = 0;

      // Calculate discounted price based on discount type
      switch (discount.type) {
        case 'percentage':
          discountAmount = (currentPrice * discount.value) / 100;
          discountedPrice = currentPrice - discountAmount;
          console.log(`Product ${product.id}: ${currentPrice} - ${discountAmount} = ${discountedPrice}`);
          break;
        
        case 'fixed':
          discountAmount = Math.min(discount.value, currentPrice);
          discountedPrice = currentPrice - discountAmount;
          break;
        
        case 'buy_x_get_y':
          // For buy X get Y, we'll set a special flag and let the frontend handle it
          discountedPrice = currentPrice;
          break;
        
        default:
          console.log(`Skipping product ${product.id} - unknown discount type:`, discount.type);
          return; // Skip unknown discount types
      }

      // Ensure price doesn't go below 0
      if (discountedPrice < 0) discountedPrice = 0;

      console.log(`Updating product ${product.id} with discount`);

      // Update product with discount information
      batch.update(doc(db, 'products', product.id), {
        salePrice: discountedPrice.toFixed(2),
        regularPrice: currentPrice.toFixed(2),
        discountInfo: {
          discountId: discountId,
          discountName: discount.name,
          discountType: discount.type,
          discountValue: discount.value,
          originalPrice: currentPrice.toFixed(2),
          discountedPrice: discountedPrice.toFixed(2),
          discountAmount: discountAmount.toFixed(2),
          appliedAt: Timestamp.now(),
          validUntil: discount.endDate
        },
        updatedAt: Timestamp.now()
      });

      updatedCount++;
      console.log(`Product ${product.id} updated successfully`);
    });

    // Commit all updates
    console.log(`Committing batch with ${updatedCount} product updates...`);
    await batch.commit();
    console.log('Batch committed successfully');

    // Update discount usage count (if the field exists)
    if (discount.usedCount !== undefined) {
      console.log('Updating discount usage count...');
      await updateDoc(doc(db, 'discounts', discountId), {
        usedCount: (discount.usedCount || 0) + 1,
        updatedAt: Timestamp.now()
      });
      console.log('Discount usage count updated');
    }

    return NextResponse.json({
      success: true,
      message: `Discount applied to ${updatedCount} products successfully`,
      updatedCount,
      discountInfo: {
        name: discount.name,
        type: discount.type,
        value: discount.value
      }
    });

  } catch (error) {
    console.error('Error applying discount:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to apply discount' 
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { discountId } = await req.json();

    if (!discountId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Discount ID is required' 
      }, { status: 400 });
    }

    // Get the discount details
    const discountRef = doc(db, 'discounts', discountId);
    const discountSnap = await getDoc(discountRef);
    
    if (!discountSnap.exists()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Discount not found' 
      }, { status: 404 });
    }
    
    const discount = discountSnap.data();

    // Get products that have this discount applied
    const productsQuery = query(
      collection(db, 'products'), 
      where('discountInfo.discountId', '==', discountId)
    );
    const productsSnap = await getDocs(productsQuery);

    if (productsSnap.empty) {
      return NextResponse.json({ 
        success: true, 
        message: 'No products found with this discount' 
      });
    }

    // Remove discount from products
    const batch = writeBatch(db);
    let updatedCount = 0;

    productsSnap.docs.forEach(productDoc => {
      const product = productDoc.data();
      
      // Restore original price
      batch.update(doc(db, 'products', productDoc.id), {
        price: product.discountInfo.originalPrice,
        salePrice: null,
        regularPrice: null,
        discountInfo: null,
        updatedAt: Timestamp.now()
      });

      updatedCount++;
    });

    // Commit all updates
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Discount removed from ${updatedCount} products successfully`,
      updatedCount
    });

  } catch (error) {
    console.error('Error removing discount:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to remove discount' 
    }, { status: 500 });
  }
}
