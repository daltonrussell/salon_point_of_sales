/*** IMPORTS ***/
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const isDev = require('electron-is-dev');
const _ = require('lodash');
const fs = require('fs');

/*** CONSTANTS & UTILITIES ***/
let mainWindow;
const generateId = () => Date.now().toString();

// Logging setup
const debugLog = path.join(app.getPath('userData'), 'debug.log');
function log(...args) {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : arg
  ).join(' ');
  fs.appendFileSync(debugLog, `${new Date().toISOString()}: ${message}\n`);
  console.log(...args);
}

/*** DATABASE SETUP ***/
const DB_PATH = isDev 
  ? path.join(__dirname, '..', 'src', 'database.json')
  : path.join(app.getPath('userData'), 'database.json');

const adapter = new FileSync(DB_PATH);
const db = low(adapter);

// Initialize database with default structure
db.defaults({
  clients: [],
  stylists: [],
  services: [],
  sales: [],
  saleItems: [],
  inventory: []
}).write();

/*** WINDOW MANAGEMENT ***/
function createWindow() {
  log('Creating window...');
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true
    }
  });

  const startUrl = isDev
  ? 'http://localhost:3000'
  : `file://${path.join(__dirname, '../build/index.html')}`;  // Changed this line

  log('Loading URL:', startUrl);
  log('Resolved path:', path.resolve(__dirname, '../build/index.html')); // Add this for debugging

  // Window event handlers
  mainWindow.webContents.on('did-start-loading', () => log('Started loading content'));
  mainWindow.webContents.on('did-finish-load', () => {
    log('Finished loading content');
    mainWindow.webContents.openDevTools();
  });
  mainWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    log('Failed to load:', errorCode, errorDescription);
  });
  mainWindow.webContents.on('crashed', () => log('WebContents crashed'));
  mainWindow.webContents.on('dom-ready', () => log('DOM is ready'));
  mainWindow.on('unresponsive', () => log('Window became unresponsive'));
  mainWindow.on('closed', () => { mainWindow = null; });

  mainWindow.loadURL(startUrl).catch(err => log('Failed to load URL:', err));
}

/*** APP LIFECYCLE ***/
app.whenReady().then(() => {
  log('App is ready, initializing...');
  try {
    createWindow();
    log('Window created successfully');
  } catch (err) {
    log('Error during initialization:', err);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Client Handlers
ipcMain.handle('create-client', async (event, clientData) => {
  try {
    const client = {
      id: generateId(),
      ...clientData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    db.get('clients').push(client).write();
    return client;
  } catch (error) {
    log('Error creating client:', error);
    throw error;
  }
});

ipcMain.handle('get-recent-clients', async (event, limit = 3) => {
  try {
    return db.get('clients')
      .orderBy('createdAt', 'desc')
      .take(limit)
      .value();
  } catch (error) {
    log('Error fetching recent clients:', error);
    throw error;
  }
});

ipcMain.handle('get-all-clients', async () => {
  try {
    return db.get('clients')
      .orderBy(['lastName', 'firstName'], ['asc', 'asc'])
      .value();
  } catch (error) {
    log('Error fetching all clients:', error);
    throw error;
  }
});

ipcMain.handle('search-clients', async (event, searchTerm) => {
  try {
    const searchTermLower = searchTerm.toLowerCase();
    return db.get('clients')
      .filter(client => 
        client.firstName.toLowerCase().includes(searchTermLower) ||
        client.lastName.toLowerCase().includes(searchTermLower) ||
        (client.phone && client.phone.includes(searchTerm))
      )
      .value();
  } catch (error) {
    log('Error searching clients:', error);
    throw error;
  }
});

ipcMain.handle('get-client', async (event, id) => {
  try {
    return db.get('clients').find({ id }).value();
  } catch (error) {
    log('Error fetching client:', error);
    throw error;
  }
});

// Service Handlers
ipcMain.handle('create-service', async (event, serviceData) => {
  try {
    const service = {
      id: generateId(),
      ...serviceData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    db.get('services').push(service).write();
    return service;
  } catch (error) {
    log('Error creating service:', error);
    throw error;
  }
});

ipcMain.handle('get-services', async (event, status = 'active') => {
  try {
    let query = db.get('services');
    if (status !== 'all') {
      query = query.filter({ status });
    }
    return query.orderBy('name', 'asc').value();
  } catch (error) {
    log('Error fetching services:', error);
    throw error;
  }
});

ipcMain.handle('update-service', async (event, { id, ...serviceData }) => {
  try {
    const service = db.get('services').find({ id });
    if (!service.value()) {
      throw new Error('Service not found');
    }
    service.assign({ ...serviceData, updatedAt: new Date() }).write();
    return service.value();
  } catch (error) {
    log('Error updating service:', error);
    throw error;
  }
});

// Stylist Handlers
ipcMain.handle('create-stylist', async (event, stylistData) => {
  try {
    const stylist = {
      id: generateId(),
      ...stylistData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    db.get('stylists').push(stylist).write();
    return stylist;
  } catch (error) {
    log('Error creating stylist:', error);
    throw error;
  }
});

ipcMain.handle('get-stylists', async (event, status = 'all') => {
  try {
    let query = db.get('stylists');
    if (status !== 'all') {
      query = query.filter({ status });
    }
    return query.orderBy(['lastName', 'firstName'], ['asc', 'asc']).value();
  } catch (error) {
    log('Error fetching stylists:', error);
    throw error;
  }
});

ipcMain.handle('update-stylist-status', async (event, { id, status }) => {
  try {
    const stylist = db.get('stylists').find({ id });
    if (!stylist.value()) {
      throw new Error('Stylist not found');
    }
    stylist.assign({ status, updatedAt: new Date() }).write();
    return stylist.value();
  } catch (error) {
    log('Error updating stylist status:', error);
    throw error;
  }
});

ipcMain.handle('delete-stylist', async (event, { id }) => {
  try {
    const stylist = db.get('stylists').find({ id });
    if (!stylist.value()) {
      throw new Error('Stylist not found');
    }
    db.get('stylists').remove({ id }).write();
    return true;
  } catch (error) {
    log('Error deleting stylist:', error);
    throw error;
  }
});

// Sale Handlers with Transaction-like Behavior
ipcMain.handle('create-sale', async (event, {
  ClientId,
  StylistId,
  services,
  products,
  subtotal,
  tax,
  total,
  paymentMethod
}) => {
  try {
    const sale = {
      id: generateId(),
      ClientId,
      StylistId,
      subtotal,
      tax,
      total,
      paymentMethod,
      saleDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Handle services
    const serviceItems = services.map(service => ({
      id: generateId(),
      SaleId: sale.id,
      ServiceId: service.serviceId,
      price: service.price,
      itemType: 'service',
      quantity: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Handle products
    const productItems = [];
    for (const product of products) {
      const inventoryItem = db.get('inventory').find({ id: product.inventoryId }).value();
      
      if (!inventoryItem) {
        throw new Error(`Product with ID ${product.inventoryId} not found`);
      }

      if (inventoryItem.quantity < product.quantity) {
        throw new Error(`Insufficient inventory for product ${inventoryItem.productName}`);
      }

      // Update inventory
      db.get('inventory')
        .find({ id: product.inventoryId })
        .assign({ 
          quantity: inventoryItem.quantity - product.quantity,
          updatedAt: new Date()
        })
        .write();

      productItems.push({
        id: generateId(),
        SaleId: sale.id,
        InventoryId: product.inventoryId,
        price: product.price,
        quantity: product.quantity,
        itemType: 'product',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Save all changes
    db.get('sales').push(sale).write();
    db.get('saleItems').push(...serviceItems, ...productItems).write();

    return { sale, saleItems: [...serviceItems, ...productItems] };
  } catch (error) {
    log('Error creating sale:', error);
    throw error;
  }
});

// Reports
ipcMain.handle('get-stylist-sales', async (event, { stylistId, startDate, endDate }) => {
  try {
    const sales = db.get('sales')
      .filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return sale.StylistId === stylistId &&
               saleDate >= new Date(startDate) &&
               saleDate <= new Date(endDate);
      })
      .value();

    const formattedSales = sales.map(sale => {
      const client = db.get('clients').find({ id: sale.ClientId }).value();
      const stylist = db.get('stylists').find({ id: sale.StylistId }).value();
      const saleItems = db.get('saleItems').filter({ SaleId: sale.id }).value();

      const items = saleItems.map(item => {
        const service = item.itemType === 'service' 
          ? db.get('services').find({ id: item.ServiceId }).value()
          : null;
        const product = item.itemType === 'product'
          ? db.get('inventory').find({ id: item.InventoryId }).value()
          : null;

        return {
          type: item.itemType,
          name: item.itemType === 'service' ? service?.name : product?.productName,
          price: item.price,
          quantity: item.quantity
        };
      });

      return {
        id: sale.id,
        saleDate: sale.saleDate,
        subtotal: sale.subtotal,
        tax: sale.tax,
        total: sale.total,
        paymentMethod: sale.paymentMethod,
        client: client ? `${client.firstName} ${client.lastName}` : 'N/A',
        stylist: stylist ? `${stylist.firstName} ${stylist.lastName}` : 'N/A',
        items
      };
    });

    return formattedSales;
  } catch (error) {
    log('Error fetching stylist sales:', error);
    throw error;
  }
});

// Inventory Reports
ipcMain.handle('get-inventory-tax-report', async (event, { startDate, endDate }) => {
  try {
    const saleItems = db.get('saleItems')
      .filter(item => {
        const createdAt = new Date(item.createdAt);
        return item.itemType === 'product' &&
               createdAt >= new Date(startDate) &&
               createdAt <= new Date(endDate);
      })
      .value();

    const groupedData = _.groupBy(saleItems, item => {
      const inventory = db.get('inventory').find({ id: item.InventoryId }).value();
      return inventory?.sku;
    });

    const reportData = Object.entries(groupedData).map(([sku, items]) => {
      const inventory = db.get('inventory').find({ sku }).value();
      const totalSold = _.sumBy(items, 'quantity');
      const totalCharged = _.sumBy(items, item => item.price * item.quantity);
      const taxRate = 0.0725;
      const taxCollected = totalCharged * taxRate;

      return {
        id: sku,
        description: inventory?.productName || 'Unknown Product',
        totalSold,
        totalCharged,
        taxCollected
      };
    });

    return reportData;
  } catch (error) {
    log('Error generating inventory tax report:', error);
    throw error;
  }
});

// Client Report
ipcMain.handle('get-clients-served-report', async (event, { startDate, endDate }) => {
  try {
    const sales = db.get('sales')
      .filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return saleDate >= new Date(startDate) &&
               saleDate <= new Date(endDate);
      })
      .value();

    const formattedData = sales.map(sale => {
      const client = db.get('clients').find({ id: sale.ClientId }).value();
      const stylist = db.get('stylists').find({ id: sale.StylistId }).value();
      const saleItems = db.get('saleItems')
        .filter({ SaleId: sale.id, itemType: 'service' })
        .value();

      const services = saleItems.map(item => {
        const service = db.get('services').find({ id: item.ServiceId }).value();
        return {
          stylist: {
            firstName: stylist?.firstName,
            lastName: stylist?.lastName
          },
          description: service?.name || 'Unknown Service',
          quantity: item.quantity,
          price: item.price
        };
      });

      return {
        date: sale.saleDate,
        client: {
          firstName: client?.firstName,
          lastName: client?.lastName
        },
        services,
        total: sale.total,
        payments: {
          cash: sale.paymentMethod === 'Cash' ? sale.total : 0,
          check: sale.paymentMethod === 'Check' ? sale.total : 0,
          creditCard: sale.paymentMethod === 'Credit Card' ? sale.total : 0,
          giftCard: sale.paymentMethod === 'Gift Card' ? sale.total : 0,
          coupon: 0,
          points: 0,
          tips: 0,
          change: 0
        }
      };
    });

    return formattedData;
  } catch (error) {
    log('Error fetching clients served report:', error);
    throw error;
  }
});

// Inventory Update
ipcMain.handle('update-inventory-quantity', async (event, { sku, quantity }) => {
  try {
    const inventory = db.get('inventory').find({ sku });
    if (!inventory.value()) {
      throw new Error('Inventory item not found');
    }

    inventory
      .assign({ 
        quantity: inventory.value().quantity + quantity,
        updatedAt: new Date()
      })
      .write();

    return inventory.value();
  } catch (error) {
    log('Error updating inventory quantity:', error);
    throw error;
  }
});