const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { Op } = require('sequelize');
const _ = require('lodash');
const { 
  setupDatabase, 
  Client, 
  Stylist, 
  Service, 
  Sale, 
  SaleItem, sequelize, Inventory
} = require('./database');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  setupDatabase();
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

// Client IPC Handlers
ipcMain.handle('create-client', async (event, clientData) => {
  try {
    const client = await Client.create(clientData, { raw: true });
    // Get the plain object version of the client
    const plainClient = await Client.findByPk(client.id, { raw: true });
    return plainClient;
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
});

ipcMain.handle('get-recent-clients', async (event, limit = 3) => {
  try {
    const clients = await Client.findAll({
      order: [['createdAt', 'DESC']],
      limit,
      raw: true
    });
    return clients;
  } catch (error) {
    console.error('Error fetching recent clients:', error);
    throw error;
  }
});

ipcMain.handle('get-all-clients', async () => {
  try {
    const clients = await Client.findAll({
      order: [
        ['lastName', 'ASC'],
        ['firstName', 'ASC']
      ],
      raw: true
    });
    return clients;
  } catch (error) {
    console.error('Error fetching all clients:', error);
    throw error;
  }
});

ipcMain.handle('search-clients', async (event, searchTerm) => {
  try {
    const clients = await Client.findAll({
      where: {
        [Op.or]: [
          {
            firstName: {
              [Op.like]: `%${searchTerm}%`
            }
          },
          {
            lastName: {
              [Op.like]: `%${searchTerm}%`
            }
          },
          {
            phone: {
              [Op.like]: `%${searchTerm}%`
            }
          }
        ]
      },
      raw: true
    });
    return clients;
  } catch (error) {
    console.error('Error searching clients:', error);
    throw error;
  }
});

ipcMain.handle('get-client', async (event, id) => {
  try {
    const client = await Client.findByPk(id, { raw: true });
    return client;
  } catch (error) {
    console.error('Error fetching client:', error);
    throw error;
  }
});

// Service IPC Handlers
ipcMain.handle('create-service', async (event, serviceData) => {
  try {
    const service = await Service.create(serviceData);
    return service;
  } catch (error) {
    console.error('Error creating service:', error);
    throw error;
  }
});

ipcMain.handle('get-services', async (event, status = 'active') => {
  try {
    const where = status !== 'all' ? { status } : {};
    const services = await Service.findAll({
      where,
      raw: true,
      order: [['name', 'ASC']]
    });
    return services;
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
});

ipcMain.handle('update-service', async (event, { id, ...serviceData }) => {
  try {
    const service = await Service.findByPk(id);
    if (!service) {
      throw new Error('Service not found');
    }
    await service.update(serviceData);
    return await service.reload();
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
});

// Stylist IPC Handlers
ipcMain.handle('create-stylist', async (event, stylistData) => {
  try {
    const stylist = await Stylist.create(stylistData);
    return stylist;
  } catch (error) {
    console.error('Error creating stylist:', error);
    throw error;
  }
});

ipcMain.handle('get-stylists', async (event, status = 'all') => {
  try {
    const where = status !== 'all' ? { status } : {};

    const stylists = await Stylist.findAll({
      where,
      raw: true,
      order: [
        ['lastName', 'ASC'],
        ['firstName', 'ASC']
      ]
    });
    
    return stylists;
  } catch (error) {
    console.error('Error fetching stylists:', error);
    throw error;
  }
});

ipcMain.handle('update-stylist-status', async (event, { id, status }) => {
  try {
    const stylist = await Stylist.findByPk(id);
    if (!stylist) {
      throw new Error('Stylist not found');
    }
    await stylist.update({ status });
    return await stylist.reload();
  } catch (error) {
    console.error('Error updating stylist status:', error);
    throw error;
  }
});

ipcMain.handle('delete-stylist', async (event, { id }) => {
  try {
    const stylist = await Stylist.findByPk(id);
    if (!stylist) {
      throw new Error('Stylist not found');
    }
    await stylist.destroy();
    return true;
  } catch (error) {
    console.error('Error deleting stylist:', error);
    throw error;
  }
});

ipcMain.handle('create-sale', async (event, {
  ClientId,  // Make sure these are being passed
  StylistId, // from the UI
  services,
  products,
  subtotal,
  tax,      // Now being passed from UI
  total,
  paymentMethod
}) => {
  try {
    const result = await sequelize.transaction(async (t) => {
      // Create the sale with client and stylist IDs
      const sale = await Sale.create({
        ClientId,    // This assigns the sale to a client
        StylistId,   // This assigns the sale to a stylist
        subtotal,
        tax,         // Using tax calculated in UI
        total,
        paymentMethod,
        saleDate: new Date()
      }, { transaction: t });

      // Create service sale items
      const serviceItems = await Promise.all(
        services.map(service =>
          SaleItem.create({
            SaleId: sale.id,  // Changed from saleId to SaleId
            ServiceId: service.serviceId,  // Changed from serviceId to ServiceId
            price: service.price,
            itemType: 'service',
            quantity: 1
          }, { transaction: t })
        )
      );

      // Create product sale items and update inventory
      const productItems = await Promise.all(
        products.map(async product => {
          const inventoryItem = await Inventory.findByPk(product.inventoryId, { transaction: t });

          if (!inventoryItem) {
            throw new Error(`Product with ID ${product.inventoryId} not found`);
          }

          if (inventoryItem.quantity < product.quantity) {
            throw new Error(`Insufficient inventory for product ${inventoryItem.productName}`);
          }

          await inventoryItem.update({
            quantity: inventoryItem.quantity - product.quantity
          }, { transaction: t });

          return SaleItem.create({
            SaleId: sale.id,  // Changed from saleId to SaleId
            InventoryId: product.inventoryId,  // Changed from inventoryId to InventoryId
            price: product.price,
            quantity: product.quantity,
            itemType: 'product'
          }, { transaction: t });
        })
      );

      return {
        sale,
        saleItems: [...serviceItems, ...productItems]
      };
    });

    return result;
  } catch (error) {
    console.error('Error creating sale:', error);
    throw error;
  }
});

// Get client sales
ipcMain.handle('get-client-sales', async (event, clientId) => {
  try {
    const sales = await Sale.findAll({
      where: { clientId },
      include: [
        { model: SaleItem, include: [Service] },
        { model: Stylist }
      ],
      order: [['saleDate', 'DESC']]
    });
    return sales;
  } catch (error) {
    console.error('Error fetching client sales:', error);
    throw error;
  }
});

// Get stylist sales for reporting
ipcMain.handle('get-stylist-sales', async (event, { stylistId, startDate, endDate }) => {
  try {
    // Get filtered sales for the specific stylist
    console.log('\n=== Filtered Sales for Stylist ===');
    const sales = await Sale.findAll({
      where: {
        StylistId: stylistId,
        saleDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: Client,
          attributes: ['firstName', 'lastName']
        },
        {
          model: Stylist,
          attributes: ['firstName', 'lastName']
        },
        {
          model: SaleItem,
          as: 'SaleItems',
          include: [
            {
              model: Service,
              attributes: ['name', 'price']
            },
            {
              model: Inventory,
              attributes: ['productName', 'salePrice']
            }
          ]
        }
      ],
      order: [['saleDate', 'DESC']]
    });

    console.log('Filtered Sales Results:', sales.map(sale => ({
      id: sale.id,
      date: sale.saleDate,
      total: sale.total,
      client: sale.Client ? `${sale.Client.firstName} ${sale.Client.lastName}` : 'No client',
      itemCount: (sale.SaleItems || []).length,
      items: (sale.SaleItems || []).map(item => ({
        type: item.itemType,
        service: item.Service?.name,
        product: item.Inventory?.productName,
        price: item.price,
        quantity: item.quantity
      }))
    })));

    // Format the final response
    const formattedSales = sales.map(sale => ({
      id: sale.id,
      saleDate: sale.saleDate,
      subtotal: sale.subtotal,
      tax: sale.tax,
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      client: sale.Client ? `${sale.Client.firstName} ${sale.Client.lastName}` : 'N/A',
      stylist: sale.Stylist ? `${sale.Stylist.firstName} ${sale.Stylist.lastName}` : 'N/A',
      items: sale.SaleItems ? sale.SaleItems.map(item => ({
        type: item.itemType,
        name: item.itemType === 'service' ? item.Service?.name : item.Inventory?.productName,
        price: item.price,
        quantity: item.quantity
      })) : []
    }));

    console.log('\n=== Final Formatted Response ===');
    console.log(JSON.stringify(formattedSales, null, 2));

    return formattedSales;
  } catch (error) {
    console.error('Error fetching stylist sales:', error);
    throw error;
  }
});
// Inventory IPC Handlers
ipcMain.handle('create-inventory', async (event, inventoryData) => {
  try {
    const inventory = await Inventory.create(inventoryData);
    return inventory.get({ plain: true });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    throw error;
  }
});

ipcMain.handle('get-all-inventory', async () => {
  try {
    return await Inventory.findAll({
      order: [['productName', 'ASC']],
      raw: true
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    throw error;
  }
});

ipcMain.handle('search-inventory', async (event, searchTerm) => {
  try {
    return await Inventory.findAll({
      where: {
        [Op.or]: [
          {
            productName: {
              [Op.like]: `%${searchTerm}%`
            }
          },
          {
            manufacturer: {
              [Op.like]: `%${searchTerm}%`
            }
          },
          {
            sku: {
              [Op.like]: `%${searchTerm}%`
            }
          }
        ]
      },
      raw: true
    });
  } catch (error) {
    console.error('Error searching inventory:', error);
    throw error;
  }
});

ipcMain.handle('search-inventory-by-sku', async (event, sku) => {
  try {
    const item = await Inventory.findOne({
      where: {
        sku: sku
      },
      raw: true
    });
    return item ? [item] : []; // Return as array to maintain consistency with frontend
  } catch (error) {
    console.error('Error searching inventory:', error);
    throw error;
  }
});

// In your electron.js file
ipcMain.handle('get-inventory-tax-report', async (event, { startDate, endDate }) => {
  try {
    // Get all sale items that are products within the date range
    const salesData = await SaleItem.findAll({
      where: {
        itemType: 'product',
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: Inventory,
          attributes: ['sku', 'productName']
        },
        {
          model: Sale,
          attributes: ['saleDate', 'tax']
        }
      ]
    });

    // Group and aggregate the data by product
    const groupedData = _.groupBy(salesData, item => item.Inventory?.sku);

    const reportData = Object.entries(groupedData).map(([sku, items]) => {
      const totalSold = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalCharged = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const taxRate = 0.0725; // Based on the example data
      const taxCollected = totalCharged * taxRate;

      return {
        id: sku,
        description: items[0].Inventory?.productName || 'Unknown Product',
        totalSold,
        totalCharged,
        taxCollected
      };
    });

    return reportData;
  } catch (error) {
    console.error('Error generating inventory tax report:', error);
    throw error;
  }
});

ipcMain.handle('update-inventory-quantity', async (event, { sku, quantity }) => {
  try {
    // Find the inventory item by SKU
    const inventory = await Inventory.findOne({ where: { sku } });
    if (!inventory) {
      throw new Error('Inventory item not found');
    }

    // Update the quantity by adding the received amount
    await inventory.increment('quantity', { by: quantity });
    await inventory.reload();

    return inventory.get({ plain: true });
  } catch (error) {
    console.error('Error updating inventory quantity:', error);
    throw error;
  }
});