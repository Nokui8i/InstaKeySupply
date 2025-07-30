const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs } = require('firebase/firestore');

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

const defaultVehicleTypes = [
  'Car',
  'Truck', 
  'SUV',
  'Van',
  'Motorcycle',
  'ATV',
  'Boat',
  'RV',
  'Commercial'
];

// Sample brands for each vehicle type
const vehicleTypeBrands = {
  'Car': ['Audi', 'BMW', 'Mercedes', 'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Kia', 'Volkswagen', 'Mazda', 'Subaru', 'Lexus', 'Acura', 'Infiniti', 'Buick', 'Cadillac', 'Chrysler', 'Dodge', 'Fiat', 'Genesis', 'Jaguar', 'Land Rover', 'Lincoln', 'Maserati', 'MINI', 'Mitsubishi', 'Porsche', 'Ram', 'Scion', 'Smart', 'Tesla', 'Volvo'],
  'Truck': ['Ford', 'Chevrolet', 'Dodge', 'Toyota', 'Nissan', 'GMC', 'Ram', 'Honda', 'Mazda', 'Mitsubishi'],
  'SUV': ['BMW', 'Mercedes', 'Audi', 'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Kia', 'Volkswagen', 'Mazda', 'Subaru', 'Lexus', 'Acura', 'Infiniti', 'Buick', 'Cadillac', 'Chrysler', 'Dodge', 'Genesis', 'Jaguar', 'Land Rover', 'Lincoln', 'MINI', 'Mitsubishi', 'Porsche', 'Tesla', 'Volvo'],
  'Van': ['Ford', 'Chevrolet', 'Dodge', 'Toyota', 'Honda', 'Nissan', 'Mercedes', 'Volkswagen'],
  'Motorcycle': ['Honda', 'Yamaha', 'Kawasaki', 'Suzuki', 'BMW', 'Ducati', 'Harley-Davidson', 'KTM', 'Triumph', 'Aprilia', 'Moto Guzzi', 'Indian', 'Victory'],
  'ATV': ['Honda', 'Yamaha', 'Kawasaki', 'Suzuki', 'Polaris', 'Can-Am', 'Arctic Cat', 'KTM'],
  'Boat': ['Yamaha', 'Mercury', 'Honda', 'Suzuki', 'Evinrude', 'Johnson', 'Mariner', 'Tohatsu', 'Nissan Marine'],
  'RV': ['Winnebago', 'Airstream', 'Fleetwood', 'Thor', 'Forest River', 'Jayco', 'Coachmen', 'Newmar', 'Tiffin', 'Entegra'],
  'Commercial': ['Ford', 'Chevrolet', 'Dodge', 'Freightliner', 'International', 'Peterbilt', 'Kenworth', 'Mack', 'Volvo', 'Western Star']
};

// Sample models for popular brands
const brandModels = {
  'Audi': {
    'A1': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'A3': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'A4': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'A6': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'Q3': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'Q5': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'Q7': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] }
  },
  'BMW': {
    'X1': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'X3': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'X5': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    '3 Series': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    '5 Series': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    '7 Series': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] }
  },
  'Mercedes': {
    'A-Class': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'C-Class': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'E-Class': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'S-Class': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'GLA': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'GLC': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'GLE': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] }
  },
  'Toyota': {
    'Camry': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'Corolla': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'RAV4': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'Highlander': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'Tacoma': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'Tundra': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] }
  },
  'Honda': {
    'Civic': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'Accord': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'CR-V': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'Pilot': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'Ridgeline': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] }
  },
  'Ford': {
    'F-150': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'F-250': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'F-350': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'Explorer': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'Escape': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] },
    'Mustang': { years: '2010-2024', keyTypes: ['Remote Key', 'Smart Key'] }
  }
};

async function initializeVehicleTypes() {
  try {
    // Check if vehicle types already exist
    const existingTypes = await getDocs(collection(db, 'vehicleTypes'));
    
    if (!existingTypes.empty) {
      console.log('Vehicle types already exist, skipping initialization');
      return;
    }

    // Add default vehicle types
    for (const typeName of defaultVehicleTypes) {
      const vehicleTypeData = {
        name: typeName,
        slug: typeName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'vehicleTypes'), vehicleTypeData);
      console.log(`Added vehicle type: ${typeName}`);
    }

    console.log('Successfully initialized all vehicle types');
  } catch (error) {
    console.error('Error initializing vehicle types:', error);
    throw error;
  }
}

async function initializeBrands() {
  try {
    // Check if brands already exist
    const existingBrands = await getDocs(collection(db, 'brands'));
    
    if (!existingBrands.empty) {
      console.log('Brands already exist, skipping initialization');
      return;
    }

    // Get vehicle types to link brands
    const vehicleTypesSnapshot = await getDocs(collection(db, 'vehicleTypes'));
    const vehicleTypes = vehicleTypesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Add brands for each vehicle type
    for (const vehicleType of vehicleTypes) {
      const brandsForType = vehicleTypeBrands[vehicleType.name] || [];
      
      for (const brandName of brandsForType) {
        const brandData = {
          name: brandName,
          slug: brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          vehicleTypeId: vehicleType.id,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await addDoc(collection(db, 'brands'), brandData);
        console.log(`Added brand: ${brandName} for vehicle type: ${vehicleType.name}`);
      }
    }

    console.log('Successfully initialized all brands');
  } catch (error) {
    console.error('Error initializing brands:', error);
    throw error;
  }
}

async function initializeModels() {
  try {
    // Check if models already exist
    const existingModels = await getDocs(collection(db, 'models'));
    
    if (!existingModels.empty) {
      console.log('Models already exist, skipping initialization');
      return;
    }

    // Get brands to link models
    const brandsSnapshot = await getDocs(collection(db, 'brands'));
    const brands = brandsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Add models for each brand
    for (const brand of brands) {
      const modelsForBrand = brandModels[brand.name] || {};
      
      for (const [modelName, modelData] of Object.entries(modelsForBrand)) {
        const modelDoc = {
          brandId: brand.id,
          name: modelName,
          slug: modelName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          years: modelData.years,
          keyTypes: modelData.keyTypes,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await addDoc(collection(db, 'models'), modelDoc);
        console.log(`Added model: ${modelName} for brand: ${brand.name}`);
      }
    }

    console.log('Successfully initialized all models');
  } catch (error) {
    console.error('Error initializing models:', error);
    throw error;
  }
}

async function runInitialization() {
  try {
    console.log('Starting database initialization...');
    await initializeVehicleTypes();
    await initializeBrands();
    await initializeModels();
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

// Run the initialization
runInitialization(); 