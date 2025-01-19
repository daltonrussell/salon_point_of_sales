const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { Op } = require('sequelize');
const { 
  setupDatabase, 
  Client, 
  Stylist, 
  Service, 
  Sale, 
  SaleItem, sequelize
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
    console.log('Fetching stylists with status:', status);
    const where = status !== 'all' ? { status } : {};
    console.log('Where clause:', where);
    
    const stylists = await Stylist.findAll({
      where,
      raw: true,
      order: [
        ['lastName', 'ASC'],
        ['firstName', 'ASC']
      ]
    });
    
    console.log('Found stylists:', stylists);
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

// Sale IPC Handlers
ipcMain.handle('create-sale', async (event, { 
  clientId, 
  stylistId, 
  items, 
  subtotal, 
  tax, 
  tip, 
  total, 
  paymentMethod 
}) => {
  try {
    // Start a transaction
    const result = await sequelize.transaction(async (t) => {
      // Create the sale
      const sale = await Sale.create({
        clientId,
        stylistId,
        subtotal,
        tax,
        tip,
        total,
        paymentMethod
      }, { transaction: t });

      // Create sale items
      const saleItems = await Promise.all(
        items.map(item => 
          SaleItem.create({
            saleId: sale.id,
            serviceId: item.serviceId,
            price: item.price
          }, { transaction: t })
        )
      );

      return { sale, saleItems };
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

    const where = {
      stylistId,
      saleDate: {
        [Op.between]: [startDate, endDate]
      }
    };


    const sales = await Sale.findAll({
      where,
      include: [
        { 
          model: SaleItem,
          include: [{
            model: Service,
            attributes: ['name', 'price']
          }],
          attributes: ['price']
        },
        {
          model: Client,
          attributes: ['firstName', 'lastName']
        },
        {
          model: Stylist,
          attributes: ['firstName', 'lastName']
        }
      ],
      attributes: [
        'id',
        'saleDate',
        'subtotal',
        'tax',
        'tip',
        'total',
        'paymentMethod'
      ],
      order: [['saleDate', 'DESC']]
    });

    // Simplify the data structure for serialization
    const simplifiedSales = sales.map(sale => ({
      id: sale.id,
      saleDate: sale.saleDate,
      subtotal: Number(sale.subtotal),
      tax: Number(sale.tax),
      tip: Number(sale.tip),
      total: Number(sale.total),
      paymentMethod: sale.paymentMethod,
      client: sale.Client ? `${sale.Client.firstName} ${sale.Client.lastName}` : 'N/A',
      stylist: sale.Stylist ? `${sale.Stylist.firstName} ${sale.Stylist.lastName}` : 'N/A',
      items: sale.SaleItems.map(item => ({
        service: item.Service.name,
        price: Number(item.price)
      }))
    }));

    console.log(simplifiedSales);

    // Calculate summary
    const summary = {
      totalSales: sales.length,
      totalRevenue: simplifiedSales.reduce((sum, sale) => sum + sale.total, 0),
      totalTips: simplifiedSales.reduce((sum, sale) => sum + sale.tip, 0),
      serviceBreakdown: {}
    };

    // Calculate service breakdown
    simplifiedSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!summary.serviceBreakdown[item.service]) {
          summary.serviceBreakdown[item.service] = {
            count: 0,
            revenue: 0
          };
        }
        summary.serviceBreakdown[item.service].count += 1;
        summary.serviceBreakdown[item.service].revenue += item.price;
      });
    });

    return {
      sales: simplifiedSales,
      summary
    };
  } catch (error) {
    console.error('Error fetching stylist sales:', error);
    throw error;
  }
});