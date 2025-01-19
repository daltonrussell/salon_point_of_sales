const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: DB_PATH,
  logging: console.log
});

// Models remain the same...
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

async function createInitialData() {
  console.log('Creating initial data...');
  
  // Create stylists
  const [rachel, lorrie] = await Promise.all([
    Stylist.create({
      firstName: 'Rachel',
      lastName: 'Russell',
      status: 'active'
    }),
    Stylist.create({
      firstName: 'Lorrie',
      lastName: 'Kingrey',
      status: 'active'
    })
  ]);
  console.log('Created stylists:', { rachel: rachel.id, lorrie: lorrie.id });

  // Create services
  const [haircut, color] = await Promise.all([
    Service.create({
      name: 'Haircut',
      price: 30.00,
      status: 'active'
    }),
    Service.create({
      name: 'Color',
      price: 80.00,
      status: 'active'
    })
  ]);
  console.log('Created services');

  // Create test client
  const client = await Client.create({
    firstName: 'John',
    lastName: 'Doe',
    phone: '555-1234'
  });

  // Create sales for both stylists
  const currentDate = new Date();
  
  // Sales for Rachel
  for (let i = 0; i < 3; i++) {
    const saleDate = new Date(currentDate);
    saleDate.setDate(currentDate.getDate() - i);

    const sale = await Sale.create({
      saleDate,
      subtotal: 110.00,
      tax: 8.80,
      tip: 22.00,
      total: 140.80,
      paymentMethod: 'cash',
      StylistId: rachel.id,
      ClientId: client.id
    });

    await Promise.all([
      SaleItem.create({
        price: haircut.price,
        SaleId: sale.id,
        ServiceId: haircut.id
      }),
      SaleItem.create({
        price: color.price,
        SaleId: sale.id,
        ServiceId: color.id
      })
    ]);
  }

  // Sales for Lorrie
  for (let i = 0; i < 2; i++) {
    const saleDate = new Date(currentDate);
    saleDate.setDate(currentDate.getDate() - i);

    const sale = await Sale.create({
      saleDate,
      subtotal: 30.00,
      tax: 2.40,
      tip: 6.00,
      total: 38.40,
      paymentMethod: 'credit',
      StylistId: lorrie.id,
      ClientId: client.id
    });

    await SaleItem.create({
      price: haircut.price,
      SaleId: sale.id,
      ServiceId: haircut.id
    });
  }

  console.log('Test data creation completed');
}

async function setupDatabase() {
  try {
    // If database exists, check if it has any stylists
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
      await createInitialData();
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
  setupDatabase,
};