require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Import models
const User = require('./src/models/User');
const Product = require('./src/models/Product');
const Order = require('./src/models/Order');

// Seed data
const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // Create Users
    console.log('👥 Creating users...');
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
    const admin = await User.create({
      username: 'admin',
      email: 'admin@production.com',
      password_hash: hashedPassword,
      role: 'admin',
    });
    
    const manager1 = await User.create({
      username: 'manager1',
      email: 'manager1@production.com',
      password_hash: hashedPassword,
      role: 'manager',
    });
    
    const manager2 = await User.create({
      username: 'manager2',
      email: 'manager2@production.com',
      password_hash: hashedPassword,
      role: 'manager',
    });
    
    const worker1 = await User.create({
      username: 'worker1',
      email: 'worker1@production.com',
      password_hash: hashedPassword,
      role: 'worker',
    });
    
    const worker2 = await User.create({
      username: 'worker2',
      email: 'worker2@production.com',
      password_hash: hashedPassword,
      role: 'worker',
    });
    
    const worker3 = await User.create({
      username: 'worker3',
      email: 'worker3@production.com',
      password_hash: hashedPassword,
      role: 'worker',
    });
    
    console.log(`✅ Created ${await User.countDocuments()} users\n`);

    // Create Products
    console.log('📦 Creating products...');
    
    const products = await Promise.all([
      Product.create({
        name: 'Cotton Fabric - White',
        reference: 'FAB-CTN-WHT-001',
        description: '100% cotton white fabric for shirts',
        unit: 'meters',
      }),
      Product.create({
        name: 'Cotton Fabric - Blue',
        reference: 'FAB-CTN-BLU-002',
        description: '100% cotton blue fabric for jeans',
        unit: 'meters',
      }),
      Product.create({
        name: 'Polyester Thread - Black',
        reference: 'THR-PLY-BLK-001',
        description: 'High strength polyester thread',
        unit: 'spools',
      }),
      Product.create({
        name: 'Metal Buttons - Silver',
        reference: 'BTN-MTL-SLV-001',
        description: 'Durable silver metal buttons',
        unit: 'pieces',
      }),
      Product.create({
        name: 'Zippers - 15cm Black',
        reference: 'ZIP-15-BLK-001',
        description: '15cm black metal zippers',
        unit: 'pieces',
      }),
      Product.create({
        name: 'Denim Fabric - Dark Blue',
        reference: 'FAB-DNM-DBL-001',
        description: 'Premium dark blue denim',
        unit: 'meters',
      }),
      Product.create({
        name: 'Elastic Band - 2cm',
        reference: 'ELS-2CM-WHT-001',
        description: '2cm white elastic band',
        unit: 'meters',
      }),
      Product.create({
        name: 'Leather Patch - Brown',
        reference: 'PTH-LTR-BRN-001',
        description: 'Genuine leather patches',
        unit: 'pieces',
      }),
    ]);
    
    console.log(`✅ Created ${products.length} products\n`);

    // Create Orders
    console.log('📋 Creating orders...');
    
    const orders = await Promise.all([
      Order.create({
        order_number: 'ORD-2025-001',
        product_id: products[0]._id,
        assigned_to: worker1._id,
        status: 'done',
        quantity: 500,
        priority: 3,
        start_date: new Date('2025-10-01T08:00:00Z'),
        end_date: new Date('2025-10-05T17:00:00Z'),
        deadline: new Date('2025-10-06T17:00:00Z'),
        created_by: manager1._id,
        notes: 'Completed on time',
      }),
      Order.create({
        order_number: 'ORD-2025-002',
        product_id: products[1]._id,
        assigned_to: worker1._id,
        status: 'in_progress',
        quantity: 300,
        priority: 4,
        start_date: new Date('2025-10-15T08:00:00Z'),
        deadline: new Date('2025-11-10T17:00:00Z'),
        created_by: manager1._id,
        notes: 'Rush order for major client',
      }),
      Order.create({
        order_number: 'ORD-2025-003',
        product_id: products[2]._id,
        assigned_to: worker2._id,
        status: 'in_progress',
        quantity: 1000,
        priority: 2,
        start_date: new Date('2025-10-20T08:00:00Z'),
        deadline: new Date('2025-11-15T17:00:00Z'),
        created_by: manager2._id,
        notes: 'Standard priority',
      }),
      Order.create({
        order_number: 'ORD-2025-004',
        product_id: products[3]._id,
        assigned_to: worker3._id,
        status: 'pending',
        quantity: 2000,
        priority: 1,
        deadline: new Date('2025-12-01T17:00:00Z'),
        created_by: manager1._id,
        notes: 'Low priority bulk order',
      }),
      Order.create({
        order_number: 'ORD-2025-005',
        product_id: products[4]._id,
        assigned_to: worker2._id,
        status: 'blocked',
        quantity: 500,
        priority: 5,
        start_date: new Date('2025-10-25T08:00:00Z'),
        deadline: new Date('2025-11-05T17:00:00Z'),
        created_by: manager2._id,
        notes: 'Blocked due to material shortage',
      }),
      Order.create({
        order_number: 'ORD-2025-006',
        product_id: products[5]._id,
        assigned_to: worker1._id,
        status: 'done',
        quantity: 200,
        priority: 4,
        start_date: new Date('2025-09-15T08:00:00Z'),
        end_date: new Date('2025-09-30T17:00:00Z'),
        deadline: new Date('2025-10-01T17:00:00Z'),
        created_by: manager1._id,
        notes: 'Completed successfully',
      }),
    ]);
    
    console.log(`✅ Created ${orders.length} orders\n`);

    console.log('🎉 Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Users: ${await User.countDocuments()}`);
    console.log(`   - Products: ${await Product.countDocuments()}`);
    console.log(`   - Orders: ${await Order.countDocuments()}`);
    console.log('\n📝 Test Credentials:');
    console.log('   Admin:    admin / Password123!');
    console.log('   Manager:  manager1 / Password123!');
    console.log('   Worker:   worker1 / Password123!\n');

  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  }
};

// Run seed
const runSeed = async () => {
  await connectDB();
  await seedData();
  await mongoose.connection.close();
  console.log('👋 Database connection closed');
  process.exit(0);
};

runSeed();
