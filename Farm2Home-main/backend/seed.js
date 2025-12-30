const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const Product = require('./src/models/Product');
const Auction = require('./src/models/Auction');

const sampleFarmers = [
  {
    fullName: 'Raj Kumar',
    email: 'raj.farmer@example.com',
    password: 'password123',
    phone: '+91-9876543210',
    role: 'farmer',
    address: {
      street: '123 Farm Road',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      country: 'India'
    },
    farmerDetails: {
      farmName: 'Kumar Organic Farm',
      farmSize: '50 acres',
      cropTypes: ['Vegetables', 'Fruits', 'Grains'],
      yearsOfExperience: 15,
      certifications: ['Organic Certified', 'ISO 9001'],
      verified: true
    }
  },
  {
    fullName: 'Priya Sharma',
    email: 'priya.farmer@example.com',
    password: 'password123',
    phone: '+91-9876543211',
    role: 'farmer',
    address: {
      street: '456 Agro Lane',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      country: 'India'
    },
    farmerDetails: {
      farmName: 'Sharma Greens',
      farmSize: '30 acres',
      cropTypes: ['Greens', 'Vegetables'],
      yearsOfExperience: 8,
      certifications: ['Organic Certified'],
      verified: true
    }
  }
];

const sampleProducts = (farmerIds) => [
  {
    name: 'Organic Tomatoes',
    description: 'Fresh, juicy organic tomatoes grown without pesticides. Perfect for salads and cooking.',
    category: 'Vegetables',
    price: 120,
    quantity: 500,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1582284924314-8c1b1f1c2b02?w=400&h=300&fit=crop',
    farmer: farmerIds[0],
    farmerName: 'Raj Kumar',
    harvest_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    certifications: ['Organic']
  },
  {
    name: 'Fresh Mangoes',
    description: 'Delicious, sweet mangoes directly from our orchard. Summer special!',
    category: 'Fruits',
    price: 250,
    quantity: 200,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1571024482220-2d731fc3e63c?w=400&h=300&fit=crop',
    farmer: farmerIds[0],
    farmerName: 'Raj Kumar',
    harvest_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    certifications: ['Organic']
  },
  {
    name: 'Organic Spinach Bundle',
    description: 'Fresh, crispy spinach leaves. Rich in iron and nutrients.',
    category: 'Greens',
    price: 40,
    quantity: 300,
    unit: 'bunch',
    image: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd37b6b?w=400&h=300&fit=crop',
    farmer: farmerIds[1],
    farmerName: 'Priya Sharma',
    harvest_date: new Date(),
    certifications: ['Organic']
  },
  {
    name: 'Wheat Flour',
    description: 'Premium whole wheat flour. Stone-ground for maximum nutrition.',
    category: 'Grains',
    price: 80,
    quantity: 100,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1537862328606-92f84a82dd0a?w=400&h=300&fit=crop',
    farmer: farmerIds[0],
    farmerName: 'Raj Kumar',
    harvest_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    certifications: []
  },
  {
    name: 'Strawberries',
    description: 'Sweet and juicy strawberries. Perfect for desserts and smoothies.',
    category: 'Fruits',
    price: 180,
    quantity: 150,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1586985289688-cacf0f4cd03b?w=400&h=300&fit=crop',
    farmer: farmerIds[1],
    farmerName: 'Priya Sharma',
    harvest_date: new Date(),
    certifications: ['Organic']
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farm2home', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Auction.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create farmers
    const farmers = await User.insertMany(sampleFarmers);
    console.log(`✅ Created ${farmers.length} farmers`);

    // Create an admin user for approving fund requests
    const admin = await User.create({
      fullName: 'Site Admin',
      email: 'admin@example.com',
      password: 'admin123',
      phone: '+91-9000000000',
      role: 'admin'
    })
    console.log('✅ Created admin user - email: admin@example.com  password: admin123')

    // Create products
    const productsData = sampleProducts(farmers.map(f => f._id));
    const products = await Product.insertMany(productsData);
    console.log(`✅ Created ${products.length} products`);

    // Create sample auctions
    const sampleAuctions = [
      {
        product: products[0]._id,
        productName: products[0].name,
        productImage: products[0].image,
        farmer: farmers[0]._id,
        farmerName: 'Raj Kumar',
        startingPrice: 100,
        currentPrice: 120,
        minBidIncrement: 10,
        startTime: new Date(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        status: 'live',
        quantity: 50,
        unit: 'kg',
        description: 'Fresh organic tomatoes auction',
        isLive: true
      },
      {
        product: products[1]._id,
        productName: products[1].name,
        productImage: products[1].image,
        farmer: farmers[0]._id,
        farmerName: 'Raj Kumar',
        startingPrice: 200,
        currentPrice: 250,
        minBidIncrement: 15,
        startTime: new Date(),
        endTime: new Date(Date.now() + 45 * 60 * 1000),
        status: 'live',
        quantity: 30,
        unit: 'kg',
        description: 'Delicious mangoes auction',
        isLive: true
      }
    ];

    const auctions = await Auction.insertMany(sampleAuctions);
    console.log(`✅ Created ${auctions.length} auctions`);

    // Create a test consumer and a pending fund request for testing approvals
    const consumer = await User.create({
      fullName: 'Test User',
      email: 'test.user@example.com',
      password: 'password123',
      phone: '+91-9222222222',
      role: 'consumer'
    })

    const FundRequest = require('./src/models/FundRequest');
    await FundRequest.create({ user: consumer._id, amount: 500 })
    console.log('✅ Created test consumer and a pending fund request (500)')

    console.log('✨ Database seeded successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('Farmer 1:');
    console.log(`  Email: ${sampleFarmers[0].email}`);
    console.log(`  Password: ${sampleFarmers[0].password}`);
    console.log('\nFarmer 2:');
    console.log(`  Email: ${sampleFarmers[1].email}`);
    console.log(`  Password: ${sampleFarmers[1].password}`);
    console.log('\nAdmin:');
    console.log('  Email: admin@example.com  Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
