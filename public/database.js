const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const { app } = require('electron');
const isDev = require('electron-is-dev');

// Set up the database path
const DB_PATH = isDev 
  ? path.join(__dirname, '..', 'src', 'database.json')
  : path.join(app.getPath('userData'), 'database.json');

const adapter = new FileSync(DB_PATH);
const db = low(adapter);

// Initialize with default structure matching your current schema
db.defaults({
  clients: [], // stores Client records
  stylists: [], // stores Stylist records
  services: [], // stores Service records
  sales: [], // stores Sale records
  saleItems: [], // stores SaleItem records
  inventory: [] // stores Inventory records
}).write();

// Helper to generate IDs
const generateId = () => Date.now().toString();

// Client model operations
const Client = {
  create: (data) => {
    const client = {
      id: generateId(),
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    db.get('clients').push(client).write();
    return client;
  },
  findAll: (options = {}) => {
    let query = db.get('clients');
    if (options.order) {
      const [field, direction] = options.order[0];
      query = query.orderBy(field, direction.toLowerCase());
    }
    return query.value();
  },
  findByPk: (id) => db.get('clients').find({ id }).value()
};

// Stylist model operations
const Stylist = {
  create: (data) => {
    const stylist = {
      id: generateId(),
      firstName: data.firstName,
      lastName: data.lastName,
      status: data.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    db.get('stylists').push(stylist).write();
    return stylist;
  },
  findAll: (options = {}) => {
    let query = db.get('stylists');
    if (options.where && options.where.status) {
      query = query.filter({ status: options.where.status });
    }
    return query.value();
  }
};

// Service model operations
const Service = {
  create: (data) => {
    const service = {
      id: generateId(),
      name: data.name,
      price: data.price,
      description: data.description || null,
      status: data.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    db.get('services').push(service).write();
    return service;
  }
};

// Sale model operations
const Sale = {
  create: async (data) => {
    const sale = {
      id: generateId(),
      ClientId: data.ClientId,
      StylistId: data.StylistId,
      saleDate: new Date(),
      subtotal: data.subtotal,
      tax: data.tax,
      total: data.total,
      paymentMethod: data.paymentMethod,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    db.get('sales').push(sale).write();

    // Handle sale items
    if (data.items) {
      data.items.forEach(item => {
        const saleItem = {
          id: generateId(),
          SaleId: sale.id,
          price: item.price,
          quantity: item.quantity || 1,
          itemType: item.itemType,
          ServiceId: item.ServiceId || null,
          InventoryId: item.InventoryId || null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        db.get('saleItems').push(saleItem).write();
      });
    }

    return sale;
  }
};

// Inventory model operations
const Inventory = {
  create: (data) => {
    const item = {
      id: generateId(),
      productName: data.productName,
      manufacturer: data.manufacturer,
      purchasePrice: data.purchasePrice,
      salePrice: data.salePrice,
      quantity: data.quantity || 0,
      sku: data.sku,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    db.get('inventory').push(item).write();
    return item;
  }
};

module.exports = {
  Client,
  Stylist,
  Service,
  Sale,
  Inventory,
  setupDatabase: async () => true // No setup needed for LowDB
};