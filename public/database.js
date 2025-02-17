const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: DB_PATH,
  logging: console.log
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

// Define relationships
Sale.belongsTo(Client);
Sale.belongsTo(Stylist);
Sale.hasMany(SaleItem);

SaleItem.belongsTo(Sale);
SaleItem.belongsTo(Service);
SaleItem.belongsTo(Inventory);

Client.hasMany(Sale);
Stylist.hasMany(Sale);

Service.hasMany(SaleItem);
Inventory.hasMany(SaleItem);

async function setupDatabase() {
  try {
    let needsInitialData = false;
    
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
    } else {
      await sequelize.sync();
    }

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Unable to setup database:', error);
    throw error;
  }
}

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