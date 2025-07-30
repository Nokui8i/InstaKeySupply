const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, setDoc } = require('firebase/firestore');
const fs = require('fs');
const csv = require('csv-parser');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBvOQhHqHqHqHqHqHqHqHqHqHqHqHqHqHq",
  authDomain: "instakeysuply.firebaseapp.com",
  projectId: "instakeysuply",
  storageBucket: "instakeysuply.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to parse CSV and import products
async function importProducts(csvFilePath) {
  const products = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        // Map CSV columns to our product structure
        const product = {
          // Basic Information
          title: row.Name || '',
          sku: row.SKU || '',
          partNumber: row.SKU || '', // Using SKU as part number
          manufacturer: '', // Will be extracted from categories or attributes
          
          // Pricing
          price: row['Regular price'] || row['Sale price'] || '',
          
          // Stock and Status
          stock: row.Stock || '0',
          lowStockAmount: row['Low stock amount'] || '5',
          status: row['In stock?'] === '1' ? 'active' : 'out-of-stock',
          availability: row['In stock?'] === '1' ? 'in-stock' : 'out-of-stock',
          isFeatured: row['Is featured?'] === '1',
          visibility: row['Visibility in catalog'] || 'visible',
          
          // Descriptions
          shortDescription: row['Short description'] || '',
          description: row.Description || '',
          
          // Technical Specifications
          technicalSpecs: {
            fccId: '',
            can: '',
            frequency: '',
            batteryType: '',
            chipType: '',
            testBlade: '',
            buttons: [],
            buttonCount: 1,
            emergencyKeyIncluded: false,
            aftermarket: true,
            reusable: false,
            cloneable: false
          },
          
          // Product Type
          isOem: false,
          isAftermarket: true,
          oemPartNumber: '',
          aftermarketPartNumber: row.SKU || '',
          
          // Additional Information
          compatibleModels: [],
          replacesKeyTypes: [],
          warranty: '',
          returnPolicy: '',
          shippingInfo: '',
          installationNotes: '',
          
          // Physical Properties
          weight: row['Weight (kg)'] || '',
          dimensions: {
            length: row['Length (cm)'] || '',
            width: row['Width (cm)'] || '',
            height: row['Height (cm)'] || ''
          },
          
          // Settings
          allowReviews: row['Allow customer reviews?'] === '1',
          purchaseNote: row['Purchase note'] || '',
          tags: row.Tags || '',
          shippingClass: row['Shipping class'] || '',
          
          // Vehicle Compatibility (will be parsed from categories/attributes)
          selectedCompatibility: [],
          
          // Timestamps
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Parse categories to extract vehicle information
        if (row.Categories) {
          const categories = row.Categories.split(',').map(cat => cat.trim());
          product.categories = categories;
          
          // Extract vehicle type, brand, model from categories
          // This is a simplified approach - you may need to adjust based on your category structure
          categories.forEach(category => {
            if (category.toLowerCase().includes('car') || category.toLowerCase().includes('vehicle')) {
              // Extract vehicle type
              if (category.toLowerCase().includes('car')) product.vehicleTypes.push('Car');
              if (category.toLowerCase().includes('truck')) product.vehicleTypes.push('Truck');
              if (category.toLowerCase().includes('suv')) product.vehicleTypes.push('SUV');
            }
          });
        }
        
        // Parse attributes for vehicle compatibility
        for (let i = 1; i <= 15; i++) {
          const attrName = row[`Attribute ${i} name`];
          const attrValue = row[`Attribute ${i} value(s)`];
          
          if (attrName && attrValue) {
            // Map common attribute names to our structure
            if (attrName.toLowerCase().includes('brand') || attrName.toLowerCase().includes('make')) {
              // Extract brand information
              const brands = attrValue.split(',').map(b => b.trim());
              // Add to compatibility if we have vehicle type
              if (product.vehicleTypes.length > 0) {
                brands.forEach(brand => {
                  product.selectedCompatibility.push({
                    vehicleType: product.vehicleTypes[0] || 'Car',
                    brand: brand,
                    model: '', // Will be filled from other attributes
                    yearStart: '',
                    yearEnd: '',
                    keyTypes: []
                  });
                });
              }
            }
            
            if (attrName.toLowerCase().includes('model')) {
              // Extract model information
              const models = attrValue.split(',').map(m => m.trim());
              // Update existing compatibility entries
              product.selectedCompatibility.forEach(comp => {
                if (!comp.model) {
                  comp.model = models[0] || '';
                }
              });
            }
            
            if (attrName.toLowerCase().includes('year')) {
              // Extract year information
              const years = attrValue.split(',').map(y => y.trim());
              if (years.length >= 2) {
                product.selectedCompatibility.forEach(comp => {
                  comp.yearStart = years[0];
                  comp.yearEnd = years[years.length - 1];
                });
              }
            }
          }
        }
        
        products.push(product);
      })
      .on('end', () => {
        console.log(`Parsed ${products.length} products from CSV`);
        resolve(products);
      })
      .on('error', reject);
  });
}

// Function to import products to Firebase
async function importToFirebase(products) {
  console.log('Starting import to Firebase...');
  
  const batchSize = 10; // Process in batches to avoid overwhelming Firebase
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)}`);
    
    for (const product of batch) {
      try {
        // Skip products without essential data
        if (!product.title || !product.sku) {
          console.log(`Skipping product without title or SKU: ${product.sku}`);
          continue;
        }
        
        // Add to Firestore
        await addDoc(collection(db, 'products'), product);
        successCount++;
        console.log(`✓ Imported: ${product.title} (${product.sku})`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Error importing ${product.sku}:`, error.message);
      }
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\nImport completed!`);
  console.log(`✓ Successfully imported: ${successCount} products`);
  console.log(`✗ Errors: ${errorCount} products`);
}

// Main execution
async function main() {
  try {
    const csvFilePath = process.argv[2];
    
    if (!csvFilePath) {
      console.error('Please provide the CSV file path as an argument');
      console.log('Usage: node import-products.js <path-to-csv-file>');
      process.exit(1);
    }
    
    if (!fs.existsSync(csvFilePath)) {
      console.error(`CSV file not found: ${csvFilePath}`);
      process.exit(1);
    }
    
    console.log(`Reading CSV file: ${csvFilePath}`);
    const products = await importProducts(csvFilePath);
    
    if (products.length === 0) {
      console.log('No products found in CSV file');
      process.exit(0);
    }
    
    await importToFirebase(products);
    
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

// Run the import
main(); 