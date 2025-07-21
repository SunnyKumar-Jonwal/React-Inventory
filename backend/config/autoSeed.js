const User = require('../models/User');
const Product = require('../models/Product');
const Sale = require('../models/Sale');

const autoSeed = async () => {
  try {
    console.log('🔍 AutoSeed: Starting database check...');
    
    // Check if any data already exists - preserve all existing data
    const userCount = await User.countDocuments();
    console.log(`👥 Found ${userCount} users in database`);
    
    const productCount = await Product.countDocuments();
    console.log(`📦 Found ${productCount} products in database`);
    
    const saleCount = await Sale.countDocuments();
    console.log(`💰 Found ${saleCount} sales in database`);
    
    if (userCount > 0 || productCount > 0 || saleCount > 0) {
      console.log(`✅ Database has existing data: ${userCount} users, ${productCount} products, ${saleCount} sales`);
      console.log('📊 SKIPPING auto-seed to preserve your existing data');
      console.log('🎉 Your products are safe and will not be deleted!');
      return;
    }

    console.log('🌱 Database is completely empty - starting auto-seed...');
    console.log('⚠️  This will only run once when database is empty');

    // Create default users
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 12);

    const users = [
      {
        username: 'admin',
        email: 'admin@inventory.com',
        password: hashedPassword,
        role: 'super_admin',
        fullName: 'System Administrator',
        phone: '+1234567890'
      },
      {
        username: 'manager',
        email: 'manager@inventory.com',
        password: hashedPassword,
        role: 'inventory_manager',
        fullName: 'John Manager',
        phone: '+1234567891'
      },
      {
        username: 'sales',
        email: 'sales@inventory.com',
        password: hashedPassword,
        role: 'sales_executive',
        fullName: 'Jane Sales',
        phone: '+1234567892'
      },
      {
        username: 'accountant',
        email: 'accountant@inventory.com',
        password: hashedPassword,
        role: 'accountant',
        fullName: 'Bob Numbers',
        phone: '+1234567893'
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log('👥 Auto-created users:', createdUsers.length);

    // Get manager user for createdBy field
    const managerUser = createdUsers.find(user => user.role === 'inventory_manager');

    // Create sample products
    const products = [
      {
        name: 'The Great Gatsby',
        description: 'Classic American novel by F. Scott Fitzgerald',
        category: 'books',
        author: 'F. Scott Fitzgerald',
        publisher: 'Scribner',
        isbn: '9780743273565',
        genre: 'Classic Literature',
        sku: 'BOOK-001',
        barcode: '9780743273565',
        costPrice: 250,
        sellingPrice: 399,
        quantity: 50,
        minStockLevel: 10,
        supplier: {
          name: 'Classic Books Publisher',
          contact: '+91-9876543210',
          email: 'contact@classicbooks.com'
        },
        createdBy: managerUser._id
      },
      {
        name: 'iPhone 15 Pro',
        description: 'Latest Apple smartphone with advanced features',
        category: 'electronics',
        brand: 'Apple',
        model: 'iPhone 15 Pro',
        specifications: new Map([
          ['Storage', '256GB'],
          ['RAM', '8GB'],
          ['Display', '6.1-inch Super Retina XDR'],
          ['Processor', 'A17 Pro chip']
        ]),
        warranty: {
          period: 12,
          description: 'Standard Apple warranty'
        },
        sku: 'ELEC-001',
        barcode: '194253164821',
        costPrice: 85000,
        sellingPrice: 119999,
        quantity: 15,
        minStockLevel: 3,
        supplier: {
          name: 'Apple Inc.',
          contact: '+91-1800-425-0744',
          email: 'business@apple.com'
        },
        createdBy: managerUser._id
      },
      // Stationery Items
      {
        name: 'Parker Jotter Ballpoint Pen',
        description: 'Premium ballpoint pen with blue ink',
        category: 'stationery',
        subcategory: 'pens',
        brand: 'Parker',
        model: 'Jotter',
        sku: 'STAT-001',
        barcode: '3501170854945',
        costPrice: 150,
        sellingPrice: 299,
        quantity: 100,
        minStockLevel: 20,
        supplier: {
          name: 'Stationery World',
          contact: '+91-9876543211',
          email: 'orders@stationeryworld.com'
        },
        createdBy: managerUser._id
      },
      {
        name: 'Apsara Platinum Extra Dark Pencil',
        description: 'High quality graphite pencil for smooth writing',
        category: 'stationery',
        subcategory: 'pencils',
        brand: 'Apsara',
        model: 'Platinum Extra Dark',
        sku: 'STAT-002',
        barcode: '8901259001234',
        costPrice: 5,
        sellingPrice: 8,
        quantity: 500,
        minStockLevel: 100,
        supplier: {
          name: 'Hindustan Pencils',
          contact: '+91-9876543212',
          email: 'sales@apsara.com'
        },
        createdBy: managerUser._id
      },
      {
        name: 'Camlin Kokuyo Exam Pad',
        description: 'A4 size exam writing pad with 100 pages',
        category: 'stationery',
        subcategory: 'notebooks',
        brand: 'Camlin Kokuyo',
        sku: 'STAT-003',
        barcode: '8901259005678',
        costPrice: 35,
        sellingPrice: 65,
        quantity: 200,
        minStockLevel: 50,
        supplier: {
          name: 'Camlin Ltd',
          contact: '+91-9876543213',
          email: 'orders@camlin.com'
        },
        createdBy: managerUser._id
      },
      // Study Guides
      {
        name: 'NCERT Class 12 Mathematics Guide',
        description: 'Comprehensive study guide for Class 12 Mathematics',
        category: 'study_guides',
        subcategory: 'academic_guides',
        publisher: 'Arihant Publications',
        sku: 'GUIDE-001',
        barcode: '9788174824567',
        costPrice: 180,
        sellingPrice: 295,
        quantity: 75,
        minStockLevel: 15,
        supplier: {
          name: 'Arihant Publications',
          contact: '+91-9876543214',
          email: 'sales@arihantbooks.com'
        },
        createdBy: managerUser._id
      },
      {
        name: 'JEE Main Physics Guide 2025',
        description: 'Complete guide for JEE Main Physics preparation',
        category: 'study_guides',
        subcategory: 'competitive_exam_guides',
        publisher: 'MTG Learning Media',
        sku: 'GUIDE-002',
        barcode: '9788174826789',
        costPrice: 320,
        sellingPrice: 499,
        quantity: 60,
        minStockLevel: 10,
        supplier: {
          name: 'MTG Learning Media',
          contact: '+91-9876543215',
          email: 'orders@mtg.in'
        },
        createdBy: managerUser._id
      },
      // Electrical Items
      {
        name: 'Philips LED Bulb 9W',
        description: 'Energy efficient LED bulb with warm white light',
        category: 'electrical',
        subcategory: 'bulbs',
        brand: 'Philips',
        model: '9W LED',
        sku: 'ELEC-002',
        barcode: '8710103234567',
        costPrice: 85,
        sellingPrice: 149,
        quantity: 150,
        minStockLevel: 30,
        supplier: {
          name: 'Philips India Ltd',
          contact: '+91-9876543216',
          email: 'orders@philips.co.in'
        },
        createdBy: managerUser._id
      },
      {
        name: 'Anchor 2.5 sq mm Copper Wire',
        description: 'High quality copper electrical wire for household use',
        category: 'electrical',
        subcategory: 'wires',
        brand: 'Anchor',
        model: '2.5 sq mm',
        sku: 'ELEC-003',
        barcode: '8906007234567',
        costPrice: 45,
        sellingPrice: 75,
        quantity: 300,
        minStockLevel: 50,
        supplier: {
          name: 'Anchor Electricals',
          contact: '+91-9876543217',
          email: 'sales@anchorelectricals.com'
        },
        createdBy: managerUser._id
      },
      // Festival Items
      {
        name: 'LED String Lights - Diwali Special',
        description: 'Colorful LED string lights for festival decoration',
        category: 'festival_items',
        subcategory: 'decorative_lights',
        brand: 'Wipro',
        sku: 'FEST-001',
        barcode: '8904320234567',
        costPrice: 120,
        sellingPrice: 199,
        quantity: 80,
        minStockLevel: 15,
        supplier: {
          name: 'Festival Decorations Co',
          contact: '+91-9876543218',
          email: 'orders@festdeco.com'
        },
        createdBy: managerUser._id
      },
      {
        name: 'Rangoli Stencil Set',
        description: 'Traditional rangoli stencils for festival decoration',
        category: 'festival_items',
        subcategory: 'rangoli_supplies',
        sku: 'FEST-002',
        barcode: '8901234567890',
        costPrice: 25,
        sellingPrice: 49,
        quantity: 120,
        minStockLevel: 25,
        supplier: {
          name: 'Craftsman Supplies',
          contact: '+91-9876543219',
          email: 'info@craftsmansupplies.com'
        },
        createdBy: managerUser._id
      }
    ];

    const createdProducts = await Product.insertMany(products);
    console.log('📦 Auto-created products:', createdProducts.length);

    // Create sample sales data
    const salesUser = createdUsers.find(user => user.role === 'sales_executive');
    const book = createdProducts.find(p => p.category === 'books');
    const phone = createdProducts.find(p => p.category === 'electronics');
    const pen = createdProducts.find(p => p.subcategory === 'pens');
    const pencils = createdProducts.find(p => p.subcategory === 'pencils');
    const bulb = createdProducts.find(p => p.subcategory === 'bulbs');
    const festivalItem = createdProducts.find(p => p.category === 'festival_items');

    const salesData = [
      {
        invoiceNumber: 'INV-001',
        items: [
          {
            product: book._id,
            productName: book.name,
            sku: book.sku,
            quantity: 2,
            unitPrice: book.sellingPrice,
            discountPercentage: 10,
            totalPrice: book.sellingPrice * 2 * 0.9 // Apply 10% discount
          }
        ],
        customer: {
          name: 'John Customer',
          email: 'john@example.com',
          phone: '+91-9876543210'
        },
        paymentMethod: 'upi',
        paymentStatus: 'paid',
        subtotal: book.sellingPrice * 2,
        totalDiscount: book.sellingPrice * 2 * 0.1,
        taxAmount: 0,
        taxPercentage: 0,
        totalAmount: book.sellingPrice * 2 * 0.9,
        amountPaid: book.sellingPrice * 2 * 0.9,
        amountDue: 0,
        saleDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        status: 'completed',
        salesPerson: salesUser._id,
        createdBy: salesUser._id
      },
      {
        invoiceNumber: 'INV-002',
        items: [
          {
            product: phone._id,
            productName: phone.name,
            sku: phone.sku,
            quantity: 1,
            unitPrice: phone.sellingPrice,
            discountPercentage: 5,
            totalPrice: phone.sellingPrice * 0.95
          }
        ],
        customer: {
          name: 'Jane Buyer',
          email: 'jane@example.com',
          phone: '+91-9876543211'
        },
        paymentMethod: 'card',
        paymentStatus: 'paid',
        subtotal: phone.sellingPrice,
        totalDiscount: phone.sellingPrice * 0.05,
        taxAmount: 0,
        taxPercentage: 0,
        totalAmount: phone.sellingPrice * 0.95,
        amountPaid: phone.sellingPrice * 0.95,
        amountDue: 0,
        saleDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        status: 'completed',
        salesPerson: salesUser._id,
        createdBy: salesUser._id
      },
      {
        invoiceNumber: 'INV-003',
        items: [
          {
            product: book._id,
            productName: book.name,
            sku: book.sku,
            quantity: 3,
            unitPrice: book.sellingPrice,
            discountPercentage: 0,
            totalPrice: book.sellingPrice * 3
          }
        ],
        customer: {
          name: 'Mike Reader',
          email: 'mike@example.com',
          phone: '+91-9876543212'
        },
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        subtotal: book.sellingPrice * 3,
        totalDiscount: 0,
        taxAmount: 0,
        taxPercentage: 0,
        totalAmount: book.sellingPrice * 3,
        amountPaid: book.sellingPrice * 3,
        amountDue: 0,
        saleDate: new Date(), // Today
        status: 'completed',
        salesPerson: salesUser._id,
        createdBy: salesUser._id
      },
      {
        invoiceNumber: 'INV-004',
        items: [
          {
            product: pen._id,
            productName: pen.name,
            sku: pen.sku,
            quantity: 5,
            unitPrice: pen.sellingPrice,
            discountPercentage: 0,
            totalPrice: pen.sellingPrice * 5
          },
          {
            product: pencils._id,
            productName: pencils.name,
            sku: pencils.sku,
            quantity: 20,
            unitPrice: pencils.sellingPrice,
            discountPercentage: 5,
            totalPrice: pencils.sellingPrice * 20 * 0.95
          }
        ],
        customer: {
          name: 'School Supply Store',
          email: 'orders@schoolsupply.com',
          phone: '+91-9876543213'
        },
        paymentMethod: 'bank_transfer',
        paymentStatus: 'paid',
        subtotal: (pen.sellingPrice * 5) + (pencils.sellingPrice * 20),
        totalDiscount: pencils.sellingPrice * 20 * 0.05,
        taxAmount: 0,
        taxPercentage: 0,
        totalAmount: (pen.sellingPrice * 5) + (pencils.sellingPrice * 20 * 0.95),
        amountPaid: (pen.sellingPrice * 5) + (pencils.sellingPrice * 20 * 0.95),
        amountDue: 0,
        saleDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        status: 'completed',
        salesPerson: salesUser._id,
        createdBy: salesUser._id
      },
      {
        invoiceNumber: 'INV-005',
        items: [
          {
            product: bulb._id,
            productName: bulb.name,
            sku: bulb.sku,
            quantity: 8,
            unitPrice: bulb.sellingPrice,
            discountPercentage: 10,
            totalPrice: bulb.sellingPrice * 8 * 0.9
          },
          {
            product: festivalItem._id,
            productName: festivalItem.name,
            sku: festivalItem.sku,
            quantity: 3,
            unitPrice: festivalItem.sellingPrice,
            discountPercentage: 0,
            totalPrice: festivalItem.sellingPrice * 3
          }
        ],
        customer: {
          name: 'Diwali Decorator',
          email: 'diwali@decorations.com',
          phone: '+91-9876543214'
        },
        paymentMethod: 'upi',
        paymentStatus: 'paid',
        subtotal: (bulb.sellingPrice * 8) + (festivalItem.sellingPrice * 3),
        totalDiscount: bulb.sellingPrice * 8 * 0.1,
        taxAmount: 0,
        taxPercentage: 0,
        totalAmount: (bulb.sellingPrice * 8 * 0.9) + (festivalItem.sellingPrice * 3),
        amountPaid: (bulb.sellingPrice * 8 * 0.9) + (festivalItem.sellingPrice * 3),
        amountDue: 0,
        saleDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        status: 'completed',
        salesPerson: salesUser._id,
        createdBy: salesUser._id
      }
    ];

    const createdSales = await Sale.insertMany(salesData);
    console.log('💰 Auto-created sales:', createdSales.length);

    console.log('✅ Auto-seeding completed successfully!');
    console.log('📋 Default login: admin@inventory.com / password123');
    console.log('🎯 Your manually added products will be preserved on future restarts!');

  } catch (error) {
    console.error('❌ Auto-seed error:', error);
  }
};

module.exports = { autoSeed };
