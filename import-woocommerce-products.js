const admin = require('firebase-admin');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('./firebase-admin-setup/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'instakeysuply.appspot.com'
});

const db = admin.firestore();
const storage = admin.storage();

// Function to download and upload image to Firebase Storage
async function uploadImageToStorage(imageUrl, productId) {
  try {
    if (!imageUrl || imageUrl.trim() === '') return null;
    
    // For now, we'll use placeholder images since we can't download from external URLs
    // In a real implementation, you'd download the image and upload it
    const placeholderImage = `/sample-key-1.png`;
    
    return placeholderImage;
  } catch (error) {
    console.error(`Error uploading image for product ${productId}:`, error);
    return null;
  }
}

// Function to parse categories string into array
function parseCategories(categoriesString) {
  if (!categoriesString || categoriesString.trim() === '') return [];
  return categoriesString.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0);
}

// Function to parse tags string into array
function parseTags(tagsString) {
  if (!tagsString || tagsString.trim() === '') return [];
  return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
}

// Function to extract vehicle information from product name/description
function extractVehicleInfo(name, description) {
  const vehicleInfo = {
    brand: '',
    year: '',
    model: '',
    keyType: ''
  };

  // Common car brands
  const brands = [
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes', 'Audi', 'Nissan',
    'Hyundai', 'Kia', 'Mazda', 'Subaru', 'Volkswagen', 'Volvo', 'Lexus', 'Acura',
    'Infiniti', 'Buick', 'Cadillac', 'Chrysler', 'Dodge', 'Jeep', 'Ram', 'GMC'
  ];

  // Extract brand
  for (const brand of brands) {
    if (name.toLowerCase().includes(brand.toLowerCase()) || 
        (description && description.toLowerCase().includes(brand.toLowerCase()))) {
      vehicleInfo.brand = brand;
      break;
    }
  }

  // Extract year (4-digit year)
  const yearMatch = name.match(/\b(19|20)\d{2}\b/) || 
                   (description && description.match(/\b(19|20)\d{2}\b/));
  if (yearMatch) {
    vehicleInfo.year = parseInt(yearMatch[0]);
  }

  // Extract key types
  const keyTypes = ['Transponder', 'Remote', 'Smart', 'Fob', 'Keyless', 'Chip'];
  for (const keyType of keyTypes) {
    if (name.toLowerCase().includes(keyType.toLowerCase()) || 
        (description && description.toLowerCase().includes(keyType.toLowerCase()))) {
      vehicleInfo.keyType = keyType;
      break;
    }
  }

  return vehicleInfo;
}

// Main import function
async function importProducts(csvFilePath) {
  const products = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        // Only import published products
        if (row.Published === '1') {
          const vehicleInfo = extractVehicleInfo(row.Name, row.Description);
          
          const product = {
            title: row.Name || '',
            model: row.SKU || '',
            price: row.Sale_price || row.Regular_price || '0',
            oldPrice: row.Sale_price && row.Regular_price && row.Sale_price !== row.Regular_price ? row.Regular_price : null,
            category: 'Car Keys',
            description: row.Description || row['Short description'] || '',
            shortDescription: row['Short description'] || '',
            sku: row.SKU || '',
            itemNumber: row.SKU || '',
            ezNumber: row.SKU || '',
            manufacturer: vehicleInfo.brand || '',
            stock: parseInt(row.Stock) || 0,
            lowStockAmount: parseInt(row['Low stock amount']) || 5,
            status: row['In stock?'] === '1' ? 'active' : 'out-of-stock',
            isFeatured: row['Is featured?'] === '1',
            visibility: row['Visibility in catalog'] === 'visible' ? 'visible' : 'hidden',
            weight: parseFloat(row['Weight (kg)']) || 0,
            dimensions: {
              length: parseFloat(row['Length (cm)']) || 0,
              width: parseFloat(row['Width (cm)']) || 0,
              height: parseFloat(row['Height (cm)']) || 0
            },
            allowReviews: row['Allow customer reviews?'] === '1',
            purchaseNote: row['Purchase note'] || '',
            salePrice: row.Sale_price || '',
            regularPrice: row.Regular_price || '',
            categories: parseCategories(row.Categories),
            tags: parseTags(row.Tags),
            shippingClass: row['Shipping class'] || '',
            images: row.Images ? row.Images.split(',').map(img => img.trim()) : [],
            vehicleType: 'Car',
            brand: vehicleInfo.brand,
            year: vehicleInfo.year,
            keyType: vehicleInfo.keyType,
            availability: row['In stock?'] === '1' ? 'in-stock' : 'out-of-stock',
            compatibleModels: [],
            replacesKeyTypes: [],
            technicalSpecs: {
              reusable: false,
              cloneable: false,
              chipType: '',
              testBlade: '',
              frequency: '',
              batteryType: ''
            },
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          products.push(product);
        }
      })
      .on('end', async () => {
        console.log(`Found ${products.length} products to import`);
        
        try {
          let importedCount = 0;
          let errorCount = 0;
          
          for (const product of products) {
            try {
              // Upload first image to Firebase Storage
              let imageUrl = null;
              if (product.images && product.images.length > 0) {
                imageUrl = await uploadImageToStorage(product.images[0], product.sku);
              }
              
              // Add imageUrl to product
              product.imageUrl = imageUrl;
              
              // Add to Firestore
              await db.collection('products').add(product);
              importedCount++;
              
              console.log(`Imported: ${product.title}`);
            } catch (error) {
              console.error(`Error importing ${product.title}:`, error);
              errorCount++;
            }
          }
          
          console.log(`\nImport completed!`);
          console.log(`Successfully imported: ${importedCount} products`);
          console.log(`Errors: ${errorCount} products`);
          
          resolve({ importedCount, errorCount });
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

// Function to create categories from imported products
async function createCategoriesFromProducts() {
  try {
    const productsSnapshot = await db.collection('products').get();
    const brands = new Set();
    const years = new Set();
    const keyTypes = new Set();
    
    productsSnapshot.forEach(doc => {
      const product = doc.data();
      if (product.brand) brands.add(product.brand);
      if (product.year) years.add(product.year.toString());
      if (product.keyType) keyTypes.add(product.keyType);
    });
    
    // Create brand categories
    for (const brand of brands) {
      await db.collection('categories').add({
        name: brand,
        slug: brand.toLowerCase().replace(/\s+/g, '-'),
        description: `${brand} car keys and remotes`,
        type: 'brand',
        sortOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Create year categories
    for (const year of years) {
      await db.collection('categories').add({
        name: year,
        slug: year,
        description: `Car keys for ${year} models`,
        type: 'year',
        sortOrder: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Create key type categories
    for (const keyType of keyTypes) {
      await db.collection('categories').add({
        name: keyType,
        slug: keyType.toLowerCase().replace(/\s+/g, '-'),
        description: `${keyType} type car keys`,
        type: 'type',
        sortOrder: 3,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    console.log(`Created ${brands.size} brand categories, ${years.size} year categories, and ${keyTypes.size} key type categories`);
  } catch (error) {
    console.error('Error creating categories:', error);
  }
}

// Main execution
async function main() {
  try {
    const csvFilePath = process.argv[2];
    
    if (!csvFilePath) {
      console.error('Please provide the path to the CSV file');
      console.log('Usage: node import-woocommerce-products.js <path-to-csv>');
      process.exit(1);
    }
    
    if (!fs.existsSync(csvFilePath)) {
      console.error(`CSV file not found: ${csvFilePath}`);
      process.exit(1);
    }
    
    console.log('Starting import process...');
    console.log(`CSV file: ${csvFilePath}`);
    
    // Import products
    const result = await importProducts(csvFilePath);
    
    // Create categories
    console.log('\nCreating categories...');
    await createCategoriesFromProducts();
    
    console.log('\nImport process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

main(); 