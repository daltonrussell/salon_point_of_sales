const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
});

// Client Model
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
});

// Stylist Model
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

// Service Model
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

// Sale Model
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
  tax: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: false 
  },
  tip: { 
    type: DataTypes.DECIMAL(10, 2), 
    defaultValue: 0 
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

// SaleItem Model
const SaleItem = sequelize.define('SaleItem', {
  price: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: false 
  }
});

// Define relationships
Sale.belongsTo(Client);
Sale.belongsTo(Stylist);
Client.hasMany(Sale);
Stylist.hasMany(Sale);

SaleItem.belongsTo(Sale);
SaleItem.belongsTo(Service);
Sale.hasMany(SaleItem);
Service.hasMany(SaleItem);

async function setupDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    await sequelize.sync();
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

module.exports = {
  sequelize,
  Client,
  Stylist,
  Service,
  Sale,
  SaleItem,
  setupDatabase,
};