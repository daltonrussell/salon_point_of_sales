const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.resolve(__dirname, 'database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: DB_PATH,
  dialectModule: require('better-sqlite3'),  // Add this line to use better-sqlite3
  logging: console.log,
  dialectOptions: {
    // better-sqlite3 specific options
    timeout: 5000,
    verbose: console.log
  }
});

const Client = sequelize.define('Client', {
  firstName: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  lastName: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  phone: DataTypes.STRING,
  email: DataTypes.STRING,
  address: DataTypes.TEXT,
});

const Stylist = sequelize.define('Stylist', {
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  },
}, {
  indexes: [
    {
      fields: ['status']
    }
  ]
});

// New Inventory model
const Inventory = sequelize.define('Inventory', {
  productName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  manufacturer: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  purchasePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  salePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

const Service = sequelize.define('Service', {
  name: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  price: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: false 
  },
  description: DataTypes.TEXT,
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  }
});

const Sale = sequelize.define('Sale', {
  saleDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  },
  subtotal: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: false 
  },
  tax: {  // Add this field
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  total: {
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: false 
  },
  paymentMethod: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
});

const SaleItem = sequelize.define('SaleItem', {
  price: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: false 
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  itemType: {
    type: DataTypes.ENUM('service', 'product'),
    allowNull: false
  }
});

// First, define all your models as you have them
// ... (your existing model definitions)

// Then, define all relationships in one place for clarity
// Sale and Client relationship
Sale.belongsTo(Client, {
  foreignKey: 'ClientId'
});
Client.hasMany(Sale, {
  foreignKey: 'ClientId'
});

// Sale and Stylist relationship
Sale.belongsTo(Stylist, {
  foreignKey: 'StylistId'
});
Stylist.hasMany(Sale, {
  foreignKey: 'StylistId'
});

// Sale and SaleItem relationship
Sale.hasMany(SaleItem, {
  foreignKey: 'SaleId',
  as: 'SaleItems'  // This alias helps when querying related items
});
SaleItem.belongsTo(Sale, {
  foreignKey: 'SaleId'
});

// SaleItem and Service relationship
SaleItem.belongsTo(Service, {
  foreignKey: 'ServiceId'
});
Service.hasMany(SaleItem, {
  foreignKey: 'ServiceId'
});

// SaleItem and Inventory relationship
SaleItem.belongsTo(Inventory, {
  foreignKey: 'InventoryId'
});
Inventory.hasMany(SaleItem, {
  foreignKey: 'InventoryId'
});

async function setupDatabase() {
  try {
    let needsInitialData = false;
    
    // Ensure the directory exists
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    if (fs.existsSync(DB_PATH)) {
      try {
        await sequelize.authenticate();
        const stylistCount = await Stylist.count();
        needsInitialData = stylistCount === 0;
        console.log('Existing database found. Stylist count:', stylistCount);
      } catch (error) {
        console.log('Error checking existing database:', error);
        needsInitialData = true;
      }
    } else {
      needsInitialData = true;
    }

    if (needsInitialData) {
      console.log('Database needs initialization...');
      await sequelize.sync({ force: true });
      await seedDatabase();
    } else {
      await sequelize.sync();
    }

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Unable to setup database:', error);
    throw error;
  }
}

async function seedDatabase() {
  try {
    // First, let's create some sample clients
    const clients = await Client.bulkCreate([
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        phone: '555-123-4567',
        email: 'sarah.j@email.com',
        address: '123 Main St, Anytown, USA'
      },
      {
        firstName: 'Michael',
        lastName: 'Smith',
        phone: '555-234-5678',
        email: 'msmith@email.com',
        address: '456 Oak Ave, Somewhere, USA'
      },
      {
        firstName: 'Emma',
        lastName: 'Davis',
        phone: '555-345-6789',
        email: 'emma.d@email.com',
        address: '789 Pine Rd, Elsewhere, USA'
      }
    ]);

    // Next, create some stylists with different statuses
    const stylists = await Stylist.bulkCreate([
      {
        firstName: 'Jessica',
        lastName: 'Williams',
        status: 'active'
      },
      {
        firstName: 'David',
        lastName: 'Anderson',
        status: 'active'
      },
      {
        firstName: 'Maria',
        lastName: 'Garcia',
        status: 'inactive'
      }
    ]);

    // Create a variety of services that a salon might offer
    const services = await Service.bulkCreate([
      {
        name: 'Women\'s Haircut',
        price: 45.00,
        description: 'Complete haircut and style',
        status: 'active'
      },
      {
        name: 'Men\'s Haircut',
        price: 30.00,
        description: 'Classic men\'s cut and style',
        status: 'active'
      },
      {
        name: 'Color Service',
        price: 85.00,
        description: 'Full color treatment',
        status: 'active'
      },
      {
        name: 'Highlights',
        price: 120.00,
        description: 'Partial or full highlights',
        status: 'active'
      },
      {
        name: 'Blowout',
        price: 35.00,
        description: 'Wash and professional blowout',
        status: 'active'
      }
    ]);

    // Create inventory items (hair products and supplies)
    const inventoryItems = await Inventory.bulkCreate([
      {
        productName: 'Professional Shampoo',
        manufacturer: 'LuxuryHair',
        purchasePrice: 12.50,
        salePrice: 24.99,
        quantity: 50,
        sku: 'SHAM001'
      },
      {
        productName: 'Conditioning Treatment',
        manufacturer: 'LuxuryHair',
        purchasePrice: 15.00,
        salePrice: 29.99,
        quantity: 40,
        sku: 'COND001'
      },
      {
        productName: 'Styling Gel',
        manufacturer: 'StylePro',
        purchasePrice: 8.00,
        salePrice: 18.99,
        quantity: 35,
        sku: 'STYLG001'
      },
      {
        productName: 'Hair Spray',
        manufacturer: 'StylePro',
        purchasePrice: 7.50,
        salePrice: 16.99,
        quantity: 45,
        sku: 'SPRY001'
      },
      {
        productName: 'Leave-in Treatment',
        manufacturer: 'HairCare Plus',
        purchasePrice: 14.00,
        salePrice: 27.99,
        quantity: 30,
        sku: 'LVIN001'
      }
    ]);

    // Create some sample sales with both services and products
    const sales = await Promise.all([
      Sale.create({
        ClientId: clients[0].id,
        StylistId: stylists[0].id,
        saleDate: new Date(),
        subtotal: 75.99,
        tax: 6.08,
        total: 82.07,
        paymentMethod: 'Credit Card'
      }),
      Sale.create({
        ClientId: clients[1].id,
        StylistId: stylists[1].id,
        saleDate: new Date(),
        subtotal: 145.98,
        tax: 11.68,
        total: 157.66,
        paymentMethod: 'Cash'
      })
    ]);

    // Create sale items for each sale
    await SaleItem.bulkCreate([
      {
        SaleId: sales[0].id,
        ServiceId: services[0].id,
        price: 45.00,
        quantity: 1,
        itemType: 'service'
      },
      {
        SaleId: sales[0].id,
        InventoryId: inventoryItems[0].id,
        price: 24.99,
        quantity: 1,
        itemType: 'product'
      },
      {
        SaleId: sales[1].id,
        ServiceId: services[2].id,
        price: 85.00,
        quantity: 1,
        itemType: 'service'
      },
      {
        SaleId: sales[1].id,
        InventoryId: inventoryItems[1].id,
        price: 29.99,
        quantity: 2,
        itemType: 'product'
      }
    ]);

    console.log('Database seeded successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// If you're using this in an Electron app, add this to handle process termination
process.on('exit', () => {
  sequelize.close();
});

module.exports = {
  sequelize,
  Client,
  Stylist,
  Service,
  Sale,
  SaleItem,
  Inventory,
  setupDatabase,
};