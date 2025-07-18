/*** IMPORTS ***/
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const isDev = require("electron-is-dev");
const _ = require("lodash");
const fs = require("fs");
const os = require("os");

/*** CONSTANTS & UTILITIES ***/
let mainWindow;
const generateId = () => Date.now().toString();

// Logging setup
const debugLog = path.join(app.getPath("userData"), "debug.log");

function log(...args) {
  const message = args
    .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg))
    .join(" ");
  fs.appendFileSync(debugLog, `${new Date().toISOString()}: ${message}\n`);
  console.log(...args);
}

/*** DATABASE SETUP ***/
const DB_PATH = isDev
  ? path.join(__dirname, "..", "src", "database.json")
  : path.join(app.getPath("userData"), "database.json");

const adapter = new FileSync(DB_PATH);
const db = low(adapter);

// Initialize database with default structure
db.defaults({
  clients: [],
  stylists: [],
  services: [],
  sales: [],
  saleItems: [],
  inventory: [],
}).write();

/*** DATABASE BACKUP FUNCTIONALITY ***/
function getOneDrivePath() {
  const userProfile = os.homedir();
  const possiblePaths = [
    path.join(userProfile, "OneDrive"),
    path.join(userProfile, "OneDrive - Personal"),
    path.join(userProfile, "OneDrive - Business"),
    path.join(userProfile, "OneDrive for Business"),
  ];

  // Check each OneDrive path
  for (const oneDrivePath of possiblePaths) {
    try {
      if (fs.existsSync(oneDrivePath)) {
        // Verify we can write to this location
        fs.accessSync(oneDrivePath, fs.constants.W_OK);
        log("Found writable OneDrive folder:", oneDrivePath);
        return oneDrivePath;
      }
    } catch (error) {
      log(`OneDrive path exists but not writable: ${oneDrivePath}`, error.message);
      continue;
    }
  }

  // Fallback options in order of preference
  const fallbackPaths = [
    path.join(userProfile, "Documents"),
    path.join(userProfile, "Desktop"),
    userProfile,
    os.tmpdir()
  ];

  for (const fallbackPath of fallbackPaths) {
    try {
      if (fs.existsSync(fallbackPath)) {
        fs.accessSync(fallbackPath, fs.constants.W_OK);
        log(`OneDrive not found, using fallback: ${fallbackPath}`);
        return fallbackPath;
      }
    } catch (error) {
      log(`Fallback path not writable: ${fallbackPath}`, error.message);
      continue;
    }
  }

  // Last resort - try to create a backup folder in temp
  const tempBackupPath = path.join(os.tmpdir(), "SalonBackups");
  log("Warning: Using temporary directory for backups:", tempBackupPath);
  return os.tmpdir();
}

function createDatabaseBackup() {
  try {
    // Check if source database file exists
    if (!fs.existsSync(DB_PATH)) {
      throw new Error(`Source database file not found: ${DB_PATH}`);
    }

    const oneDrivePath = getOneDrivePath();
    const backupFolder = path.join(oneDrivePath, "SalonBackups");

    // Create backup folder if it doesn't exist
    if (!fs.existsSync(backupFolder)) {
      try {
        fs.mkdirSync(backupFolder, { recursive: true });
        log("Created backup folder:", backupFolder);
      } catch (folderError) {
        log("Failed to create backup folder:", folderError);
        throw new Error(`Cannot create backup folder: ${backupFolder}. ${folderError.message}`);
      }
    }

    // Verify we can write to the backup folder
    try {
      fs.accessSync(backupFolder, fs.constants.W_OK);
    } catch (accessError) {
      throw new Error(`No write permission to backup folder: ${backupFolder}`);
    }

    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `salon-database-${timestamp}.json`;
    const backupPath = path.join(backupFolder, backupFileName);

    // Copy database file with error handling
    try {
      fs.copyFileSync(DB_PATH, backupPath);
      log("Database backup created:", backupPath);
    } catch (copyError) {
      log("Failed to copy database file:", copyError);
      throw new Error(`Failed to create backup file: ${copyError.message}`);
    }

    // Verify the backup was created successfully
    if (!fs.existsSync(backupPath)) {
      throw new Error("Backup file was not created successfully");
    }

    // Verify backup file size (should be > 0)
    const backupStats = fs.statSync(backupPath);
    if (backupStats.size === 0) {
      fs.unlinkSync(backupPath); // Remove empty file
      throw new Error("Backup file is empty");
    }

    // Clean up old backups (don't let this fail the main backup)
    try {
      cleanupOldBackups(backupFolder);
    } catch (cleanupError) {
      log("Warning: Failed to cleanup old backups:", cleanupError);
      // Don't throw - backup was successful even if cleanup failed
    }

    return backupPath;
  } catch (error) {
    log("Error creating database backup:", error);
    throw error;
  }
}

function cleanupOldBackups(backupFolder) {
  try {
    if (!fs.existsSync(backupFolder)) {
      log("Backup folder doesn't exist, skipping cleanup");
      return;
    }

    const files = fs.readdirSync(backupFolder);
    const backupFiles = files.filter(file => file.startsWith('salon-database-') && file.endsWith('.json'));

    if (backupFiles.length <= 30) {
      log(`Only ${backupFiles.length} backup files, no cleanup needed`);
      return;
    }

    // Sort by creation time (newest first)
    const fileStats = backupFiles.map(file => {
      try {
        return {
          name: file,
          path: path.join(backupFolder, file),
          mtime: fs.statSync(path.join(backupFolder, file)).mtime
        };
      } catch (statError) {
        log(`Warning: Could not stat backup file ${file}:`, statError.message);
        return null;
      }
    }).filter(Boolean).sort((a, b) => b.mtime - a.mtime);

    // Keep only the last 30 backups
    const filesToDelete = fileStats.slice(30);
    let deletedCount = 0;

    filesToDelete.forEach(file => {
      try {
        fs.unlinkSync(file.path);
        log("Deleted old backup:", file.name);
        deletedCount++;
      } catch (deleteError) {
        log(`Warning: Could not delete backup file ${file.name}:`, deleteError.message);
      }
    });

    if (deletedCount > 0) {
      log(`Cleaned up ${deletedCount} old backup files`);
    }
  } catch (error) {
    log("Error during backup cleanup:", error.message);
    // Don't throw - cleanup failure shouldn't prevent new backups
  }
}

function schedulePeriodicBackups() {
  // Create initial backup with error handling
  try {
    createDatabaseBackup();
    log("Initial database backup created successfully");
  } catch (error) {
    log("Warning: Initial database backup failed:", error.message);
    // Don't prevent app startup if initial backup fails
  }

  // Schedule backups every 4 hours (14400000 ms)
  setInterval(() => {
    log("Creating scheduled database backup...");
    try {
      createDatabaseBackup();
      log("Scheduled backup completed successfully");
    } catch (error) {
      log("Warning: Scheduled backup failed:", error.message);
      // Continue running - don't crash the app if backup fails
    }
  }, 4 * 60 * 60 * 1000);

  log("Periodic database backups scheduled every 4 hours");
}

/*** WINDOW MANAGEMENT ***/
function createWindow() {
  log("Creating window...");
  mainWindow = new BrowserWindow({
    width: 1600, // Increased from 1200 to 1600 (+400px)
    height: 1000, // Increased from 800 to 1000 (+200px)
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const startUrl = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "../build/index.html")}`; // Changed this line

  log("Loading URL:", startUrl);
  log("Resolved path:", path.resolve(__dirname, "../build/index.html")); // Add this for debugging

  // Window event handlers
  mainWindow.webContents.on("did-start-loading", () =>
    log("Started loading content"),
  );
  mainWindow.webContents.on("did-finish-load", () => {
    log("Finished loading content");
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });
  mainWindow.webContents.on(
    "did-fail-load",
    (_, errorCode, errorDescription) => {
      log("Failed to load:", errorCode, errorDescription);
    },
  );
  mainWindow.webContents.on("crashed", () => log("WebContents crashed"));
  mainWindow.webContents.on("dom-ready", () => log("DOM is ready"));
  mainWindow.on("unresponsive", () => log("Window became unresponsive"));
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.loadURL(startUrl).catch((err) => log("Failed to load URL:", err));
}

/*** APP LIFECYCLE ***/
app.whenReady().then(async () => {
  log("App is ready, initializing...");
  try {
    // Clear printer queue on startup (Windows example)
    const { exec } = require("child_process");
    const util = require("util");
    const execPromise = util.promisify(exec);

    const clients = db.get("clients").value();
    let updated = false;

    clients.forEach((client) => {
      if (client.showInUI === undefined) {
        db.get("clients")
          .find({ id: client.id })
          .assign({ showInUI: true })
          .write();
        updated = true;
      }
    });

    const inventoryItems = db.get("inventory").value();
    inventoryItems.forEach((item) => {
      if (item.showInUI === undefined) {
        db.get("inventory")
          .find({ id: item.id })
          .assign({ showInUI: true })
          .write();
        updated = true;
      }
    });

    if (updated) {
      log("Updated existing clients with showInUI field");
      log("Updated existing inventory items with showInUI field");
    }

    try {
      const printerName = "BTP-M280(U) 1"; // Your receipt printer name
      const command = `powershell -command "Get-PrintJob -PrinterName '${printerName}' | Remove-PrintJob"`;
      await execPromise(command);
      log("Cleared printer queue on startup");
    } catch (err) {
      log("Could not clear printer queue:", err);
    }

    // Continue with normal initialization
    createWindow();
    log("Window created successfully");

    // Initialize database backups
    schedulePeriodicBackups();
    log("Database backup system initialized");
  } catch (err) {
    log("Error during initialization:", err);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Client Handlers
ipcMain.handle("create-client", async (event, clientData) => {
  try {
    const client = {
      id: generateId(),
      ...clientData,
      showInUI: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.get("clients").push(client).write();
    return client;
  } catch (error) {
    log("Error creating client:", error);
    throw error;
  }
});

ipcMain.handle("get-recent-clients", async (event, limit = 3) => {
  try {
    return db.get("clients").orderBy("createdAt", "desc").take(limit).value();
  } catch (error) {
    log("Error fetching recent clients:", error);
    throw error;
  }
});

ipcMain.handle("get-all-clients", async () => {
  try {
    return db
      .get("clients")
      .filter({ showInUI: true }) // Only return clients marked as visible
      .orderBy(["lastName", "firstName"], ["asc", "asc"])
      .value();
  } catch (error) {
    log("Error fetching all clients:", error);
    throw error;
  }
});

ipcMain.handle("search-clients", async (event, searchTerm) => {
  try {
    const searchTermLower = searchTerm.toLowerCase();
    return db
      .get("clients")
      .filter(
        (client) =>
          client.showInUI === true && // Only include visible clients
          (client.firstName.toLowerCase().includes(searchTermLower) ||
            client.lastName.toLowerCase().includes(searchTermLower) ||
            (client.phone && client.phone.includes(searchTerm))),
      )
      .value();
  } catch (error) {
    log("Error searching clients:", error);
    throw error;
  }
});

ipcMain.handle("restore-client", async (event, { id }) => {
  try {
    const client = db.get("clients").find({ id });
    if (!client.value()) {
      throw new Error("Client not found");
    }

    client
      .assign({
        showInUI: true,
        updatedAt: new Date(),
      })
      .write();

    return {
      success: true,
      message: "Client successfully restored",
    };
  } catch (error) {
    log("Error restoring client:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

ipcMain.handle("get-hidden-clients", async () => {
  try {
    return db
      .get("clients")
      .filter({ showInUI: false })
      .orderBy(["lastName", "firstName"], ["asc", "asc"])
      .value();
  } catch (error) {
    log("Error fetching hidden clients:", error);
    throw error;
  }
});

ipcMain.handle("get-client", async (event, id) => {
  try {
    return db.get("clients").find({ id }).value();
  } catch (error) {
    log("Error fetching client:", error);
    throw error;
  }
});

// Service Handlers
ipcMain.handle("create-service", async (event, serviceData) => {
  try {
    const service = {
      id: generateId(),
      ...serviceData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.get("services").push(service).write();
    return service;
  } catch (error) {
    log("Error creating service:", error);
    throw error;
  }
});

ipcMain.handle("get-services", async (event, status = "active") => {
  try {
    let query = db.get("services");
    if (status !== "all") {
      query = query.filter({ status });
    }
    return query.orderBy("name", "asc").value();
  } catch (error) {
    log("Error fetching services:", error);
    throw error;
  }
});

ipcMain.handle("update-service", async (event, { id, ...serviceData }) => {
  try {
    const service = db.get("services").find({ id });
    if (!service.value()) {
      throw new Error("Service not found");
    }
    service.assign({ ...serviceData, updatedAt: new Date() }).write();
    return service.value();
  } catch (error) {
    log("Error updating service:", error);
    throw error;
  }
});

// Stylist Handlers
ipcMain.handle("create-stylist", async (event, stylistData) => {
  try {
    const stylist = {
      id: generateId(),
      ...stylistData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.get("stylists").push(stylist).write();
    return stylist;
  } catch (error) {
    log("Error creating stylist:", error);
    throw error;
  }
});

ipcMain.handle("get-stylists", async (event, status = "all") => {
  try {
    let query = db.get("stylists");
    if (status !== "all") {
      query = query.filter({ status });
    }
    return query.orderBy(["lastName", "firstName"], ["asc", "asc"]).value();
  } catch (error) {
    log("Error fetching stylists:", error);
    throw error;
  }
});

ipcMain.handle("update-stylist-status", async (event, { id, status }) => {
  try {
    const stylist = db.get("stylists").find({ id });
    if (!stylist.value()) {
      throw new Error("Stylist not found");
    }
    stylist.assign({ status, updatedAt: new Date() }).write();
    return stylist.value();
  } catch (error) {
    log("Error updating stylist status:", error);
    throw error;
  }
});

ipcMain.handle("delete-stylist", async (event, { id }) => {
  try {
    const stylist = db.get("stylists").find({ id });
    if (!stylist.value()) {
      throw new Error("Stylist not found");
    }
    db.get("stylists").remove({ id }).write();
    return true;
  } catch (error) {
    log("Error deleting stylist:", error);
    throw error;
  }
});

// Sale Handlers with Transaction-like Behavior
ipcMain.handle(
  "create-sale",
  async (
    event,
    {
      ClientId,
      StylistId,
      services,
      products,
      subtotal,
      tax,
      tip,
      total,
      paymentMethod,
      saleDate,
    },
  ) => {
    try {
      const sale = {
        id: generateId(),
        ClientId,
        StylistId,
        subtotal,
        tax,
        tip: tip || 0, // Add tip field
        total,
        paymentMethod,
        saleDate: saleDate || new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Handle services
      const serviceItems = services.map((service) => ({
        id: generateId(),
        SaleId: sale.id,
        ServiceId: service.serviceId,
        price: service.price,
        itemType: "service",
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      // Handle products
      const productItems = [];
      for (const product of products) {
        const inventoryItem = db
          .get("inventory")
          .find({ id: product.inventoryId })
          .value();

        if (!inventoryItem) {
          throw new Error(`Product with ID ${product.inventoryId} not found`);
        }

        if (inventoryItem.quantity < product.quantity) {
          throw new Error(
            `Insufficient inventory for product ${inventoryItem.productName}`,
          );
        }

        // Update inventory
        db.get("inventory")
          .find({ id: product.inventoryId })
          .assign({
            quantity: inventoryItem.quantity - product.quantity,
            updatedAt: new Date(),
          })
          .write();

        productItems.push({
          id: generateId(),
          SaleId: sale.id,
          InventoryId: product.inventoryId,
          price: product.price,
          quantity: product.quantity,
          itemType: "product",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Save all changes
      db.get("sales").push(sale).write();
      db.get("saleItems")
        .push(...serviceItems, ...productItems)
        .write();

      return { sale, saleItems: [...serviceItems, ...productItems] };
    } catch (error) {
      log("Error creating sale:", error);
      throw error;
    }
  },
);

// Reports
ipcMain.handle(
  "get-stylist-sales",
  async (event, { stylistId, startDate, endDate, includeVoided = false }) => {
    try {
      let salesQuery = db.get("sales").filter((sale) => {
        const saleDate = new Date(sale.saleDate);
        const matchesStylist = sale.StylistId === stylistId;
        const inDateRange =
          saleDate >= new Date(startDate) && saleDate <= new Date(endDate);

        // Only include non-voided sales unless explicitly requested
        const voidCheck = includeVoided ? true : !sale.isVoided;

        return matchesStylist && inDateRange && voidCheck;
      });

      const sales = salesQuery.value();

      const formattedSales = sales.map((sale) => {
        const client = db.get("clients").find({ id: sale.ClientId }).value();
        const stylist = db.get("stylists").find({ id: sale.StylistId }).value();
        const saleItems = db
          .get("saleItems")
          .filter({ SaleId: sale.id })
          .value();

        const items = saleItems.map((item) => {
          const service =
            item.itemType === "service"
              ? db.get("services").find({ id: item.ServiceId }).value()
              : null;
          const product =
            item.itemType === "product"
              ? db.get("inventory").find({ id: item.InventoryId }).value()
              : null;

          return {
            type: item.itemType,
            name:
              item.itemType === "service"
                ? service?.name
                : product?.productName,
            price: item.price,
            quantity: item.quantity,
          };
        });

        return {
          id: sale.id,
          saleDate: sale.saleDate,
          subtotal: sale.subtotal,
          tax: sale.tax,
          total: sale.total,
          paymentMethod: sale.paymentMethod,
          isVoided: !!sale.isVoided,
          voidReason: sale.voidReason || null,
          voidedAt: sale.voidedAt || null,
          client: client ? `${client.firstName} ${client.lastName}` : "N/A",
          stylist: stylist ? `${stylist.firstName} ${stylist.lastName}` : "N/A",
          items,
        };
      });

      return formattedSales;
    } catch (error) {
      log("Error fetching stylist sales:", error);
      throw error;
    }
  },
);

ipcMain.handle(
  "get-stylist-services",
  async (
    event,
    { stylistIds, serviceIds, startDate, endDate, includeVoided = false },
  ) => {
    try {
      // Get all sales within the date range
      const sales = db
        .get("sales")
        .filter((sale) => {
          const saleDate = new Date(sale.saleDate);
          const inDateRange =
            saleDate >= new Date(startDate) && saleDate <= new Date(endDate);

          // Filter by void status if needed
          const voidCheck = includeVoided ? true : !sale.isVoided;

          // Filter by stylist if specified
          const stylistCheck = stylistIds
            ? stylistIds.includes(sale.StylistId)
            : true;

          return inDateRange && voidCheck && stylistCheck;
        })
        .value();

      // Get IDs of sales for filtering sale items
      const saleIds = sales.map((sale) => sale.id);

      // Get all service sale items from these sales
      let saleItems = db
        .get("saleItems")
        .filter((item) => {
          return saleIds.includes(item.SaleId) && item.itemType === "service";
        })
        .value();

      // Filter by service IDs if specified
      if (serviceIds && serviceIds.length > 0) {
        saleItems = saleItems.filter((item) =>
          serviceIds.includes(item.ServiceId),
        );
      }

      // Build the report data with all needed information
      const reportData = saleItems.map((item) => {
        const sale = sales.find((s) => s.id === item.SaleId);
        const service = db.get("services").find({ id: item.ServiceId }).value();
        const stylist = db.get("stylists").find({ id: sale.StylistId }).value();
        const client = db.get("clients").find({ id: sale.ClientId }).value();

        return {
          saleDate: sale.saleDate,
          serviceId: item.ServiceId,
          serviceName: service ? service.name : "Unknown Service",
          stylistId: sale.StylistId,
          stylistName: stylist
            ? `${stylist.firstName} ${stylist.lastName}`
            : "Unknown Stylist",
          clientId: sale.ClientId,
          clientName: client
            ? `${client.firstName} ${client.lastName}`
            : "Unknown Client",
          price: item.price,
          isVoided: !!sale.isVoided,
        };
      });

      return reportData;
    } catch (error) {
      log("Error generating stylist services report:", error);
      throw error;
    }
  },
);

// Inventory Reports
ipcMain.handle(
  "get-inventory-tax-report",
  async (event, { startDate, endDate, includeVoided = false }) => {
    try {
      // First, get all sales in the date range
      const sales = db
        .get("sales")
        .filter((sale) => {
          const saleDate = new Date(sale.saleDate);
          const inDateRange =
            saleDate >= new Date(startDate) && saleDate <= new Date(endDate);

          // Only include non-voided sales unless explicitly requested
          const voidCheck = includeVoided ? true : !sale.isVoided;

          return inDateRange && voidCheck;
        })
        .value();

      // Get IDs of non-voided sales for filtering sale items
      const validSaleIds = sales.map((sale) => sale.id);

      // Filter sale items to only include those from valid sales
      const saleItems = db
        .get("saleItems")
        .filter((item) => {
          return (
            validSaleIds.includes(item.SaleId) && item.itemType === "product"
          );
        })
        .value();

      const groupedData = _.groupBy(saleItems, (item) => {
        const inventory = db
          .get("inventory")
          .find({ id: item.InventoryId })
          .value();
        return inventory?.sku;
      });

      const reportData = Object.entries(groupedData).map(([sku, items]) => {
        const inventory = db.get("inventory").find({ sku }).value();
        const totalSold = _.sumBy(items, "quantity");

        // FIXED: Just sum the prices directly as they should already include quantity
        const totalCharged = _.sumBy(items, "price");

        const taxRate = 0.0725;
        const taxCollected = totalCharged * taxRate;

        return {
          id: sku,
          description: inventory?.productName || "Unknown Product",
          totalSold,
          totalCharged,
          taxCollected,
        };
      });

      return reportData;
    } catch (error) {
      log("Error generating inventory tax report:", error);
      throw error;
    }
  },
);

// Client Report
ipcMain.handle(
  "get-clients-served-report",
  async (event, { startDate, endDate, includeVoided = false }) => {
    try {
      const sales = db
        .get("sales")
        .filter((sale) => {
          const saleDate = new Date(sale.saleDate);
          const inDateRange =
            saleDate >= new Date(startDate) && saleDate <= new Date(endDate);

          // Only include non-voided sales unless explicitly requested
          const voidCheck = includeVoided ? true : !sale.isVoided;

          return inDateRange && voidCheck;
        })
        .value();

      const formattedData = sales.map((sale) => {
        const client = db.get("clients").find({ id: sale.ClientId }).value();
        const stylist = db.get("stylists").find({ id: sale.StylistId }).value();
        const saleItems = db
          .get("saleItems")
          .filter({ SaleId: sale.id, itemType: "service" })
          .value();

        const services = saleItems.map((item) => {
          const service = db
            .get("services")
            .find({ id: item.ServiceId })
            .value();
          return {
            stylist: {
              firstName: stylist?.firstName,
              lastName: stylist?.lastName,
            },
            description: service?.name || "Unknown Service",
            quantity: item.quantity,
            price: item.price,
          };
        });

        return {
          date: sale.saleDate,
          isVoided: !!sale.isVoided,
          voidReason: sale.voidReason || null,
          client: {
            firstName: client?.firstName,
            lastName: client?.lastName,
          },
          services,
          total: sale.total,
          payments: {
            cash: sale.paymentMethod === "Cash" ? sale.total : 0,
            check: sale.paymentMethod === "Check" ? sale.total : 0,
            creditCard: sale.paymentMethod === "Credit Card" ? sale.total : 0,
            giftCard: sale.paymentMethod === "Gift Card" ? sale.total : 0,
            coupon: 0,
            points: 0,
            tips: 0,
            change: 0,
          },
        };
      });

      return formattedData;
    } catch (error) {
      log("Error fetching clients served report:", error);
      throw error;
    }
  },
);

// New report handler specifically for voided sales
ipcMain.handle(
  "get-voided-sales-report",
  async (event, { startDate, endDate }) => {
    try {
      const voidedSales = db
        .get("sales")
        .filter((sale) => {
          // Get only voided sales
          if (!sale.isVoided) return false;

          const voidDate = sale.voidedAt
            ? new Date(sale.voidedAt)
            : new Date(sale.updatedAt);
          return (
            voidDate >= new Date(startDate) && voidDate <= new Date(endDate)
          );
        })
        .value();

      const formattedSales = voidedSales.map((sale) => {
        const client = db.get("clients").find({ id: sale.ClientId }).value();
        const stylist = db.get("stylists").find({ id: sale.StylistId }).value();
        const saleItems = db
          .get("saleItems")
          .filter({ SaleId: sale.id })
          .value();

        const services = saleItems
          .filter((item) => item.itemType === "service")
          .map((item) => {
            const service = db
              .get("services")
              .find({ id: item.ServiceId })
              .value();
            return { ...item, service };
          });

        const products = saleItems
          .filter((item) => item.itemType === "product")
          .map((item) => {
            const product = db
              .get("inventory")
              .find({ id: item.InventoryId })
              .value();
            return { ...item, product };
          });

        // Calculate service and product totals
        const serviceTotal = _.sumBy(services, (item) => item.price);
        const productTotal = _.sumBy(products, (item) => item.price);

        return {
          id: sale.id,
          saleDate: sale.saleDate,
          voidedAt: sale.voidedAt || sale.updatedAt,
          voidReason: sale.voidReason || "No reason provided",
          client: client ? `${client.firstName} ${client.lastName}` : "N/A",
          stylist: stylist ? `${stylist.firstName} ${stylist.lastName}` : "N/A",
          subtotal: sale.subtotal,
          tax: sale.tax,
          total: sale.total,
          serviceTotal,
          productTotal,
          serviceCount: services.length,
          productCount: products.length,
        };
      });

      return formattedSales;
    } catch (error) {
      log("Error generating voided sales report:", error);
      throw error;
    }
  },
);

// Luxury Sales Report Handler
ipcMain.handle(
  "get-luxury-sales-report",
  async (event, { stylistId, startDate, endDate, includeVoided = false }) => {
    try {
      // Get all sales within the date range
      const sales = db
        .get("sales")
        .filter((sale) => {
          const saleDate = new Date(sale.saleDate);
          const inDateRange =
            saleDate >= new Date(startDate) && saleDate <= new Date(endDate);

          // Filter by void status if needed
          const voidCheck = includeVoided ? true : !sale.isVoided;

          // Filter by stylist if specified
          const stylistCheck = stylistId ? sale.StylistId === stylistId : true;

          return inDateRange && voidCheck && stylistCheck;
        })
        .value();

      // Get all sale items for these sales that are luxury services
      const luxurySaleItems = [];

      sales.forEach((sale) => {
        const saleItems = db
          .get("saleItems")
          .filter({ SaleId: sale.id, itemType: "service" })
          .value();

        saleItems.forEach((item) => {
          const service = db.get("services").find({ id: item.ServiceId }).value();
          if (service && service.luxury) {
            luxurySaleItems.push({
              ...item,
              sale,
              service,
            });
          }
        });
      });

      // Group by stylist
      const groupedByStylist = _.groupBy(luxurySaleItems, (item) => item.sale.StylistId);

      // Get tax rate from localStorage or use default
      const taxRate = 0.0725; // Default tax rate, could be made configurable

      // Format the report data
      const reportData = Object.entries(groupedByStylist).map(([stylistId, items]) => {
        const stylist = db.get("stylists").find({ id: stylistId }).value();

        const luxuryItems = items.map((item) => {
          const client = db.get("clients").find({ id: item.sale.ClientId }).value();

          return {
            saleDate: item.sale.saleDate,
            clientName: client ? `${client.firstName} ${client.lastName}` : "N/A",
            serviceName: item.service.name,
            serviceDescription: item.service.description || "",
            price: item.price,
            quantity: item.quantity || 1,
            subtotal: item.price * (item.quantity || 1),
            tax: item.price * (item.quantity || 1) * taxRate,
            total: item.price * (item.quantity || 1) * (1 + taxRate),
          };
        });

        const totalSubtotal = _.sumBy(luxuryItems, 'subtotal');
        const totalTax = _.sumBy(luxuryItems, 'tax');
        const totalAmount = _.sumBy(luxuryItems, 'total');

        return {
          stylistId,
          stylistName: stylist ? `${stylist.firstName} ${stylist.lastName}` : "Unknown Stylist",
          luxuryItems,
          totalSubtotal,
          totalTax,
          totalAmount,
          itemCount: luxuryItems.length,
        };
      });

      return reportData;
    } catch (error) {
      log("Error generating luxury sales report:", error);
      throw error;
    }
  },
);

// Inventory Update
ipcMain.handle(
  "update-inventory-quantity",
  async (event, { sku, quantity }) => {
    try {
      const inventory = db.get("inventory").find({ sku });
      if (!inventory.value()) {
        throw new Error("Inventory item not found");
      }

      inventory
        .assign({
          quantity: inventory.value().quantity + quantity,
          updatedAt: new Date(),
        })
        .write();

      return inventory.value();
    } catch (error) {
      log("Error updating inventory quantity:", error);
      throw error;
    }
  },
);

// Add these handlers right after the other IPC handlers in your main process file

// Inventory Handlers
ipcMain.handle("get-all-inventory", async () => {
  try {
    return db
      .get("inventory")
      .filter((item) => item.showInUI !== false) // Only show visible items
      .orderBy(["productName"], ["asc"])
      .value();
  } catch (error) {
    log("Error fetching all inventory:", error);
    throw error;
  }
});

ipcMain.handle("create-inventory", async (event, inventoryData) => {
  try {
    const item = {
      id: generateId(),
      ...inventoryData,
      showInUI: true, // Add this field
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.get("inventory").push(item).write();
    return item;
  } catch (error) {
    log("Error creating inventory item:", error);
    throw error;
  }
});

ipcMain.handle("search-inventory", async (event, searchTerm) => {
  try {
    const searchTermLower = searchTerm.toLowerCase();
    return db
      .get("inventory")
      .filter(
        (item) =>
          item.showInUI !== false && // Only include visible items
          (item.productName.toLowerCase().includes(searchTermLower) ||
            item.manufacturer.toLowerCase().includes(searchTermLower) ||
            item.sku.toLowerCase().includes(searchTermLower)),
      )
      .value();
  } catch (error) {
    log("Error searching inventory:", error);
    throw error;
  }
});

ipcMain.handle("search-inventory-by-sku", async (event, sku) => {
  try {
    return db
      .get("inventory")
      .filter(
        (item) =>
          item.showInUI !== false && // Only include visible items
          item.sku.toLowerCase() === sku.toLowerCase(),
      )
      .value();
  } catch (error) {
    log("Error searching inventory by SKU:", error);
    throw error;
  }
});

ipcMain.handle("print-receipt", async (event, { saleData, businessInfo }) => {
  log("Starting print receipt process...");

  try {
    log("Creating print window...");
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    // Get printer list and find our SNBC printer
    const printers = await printWindow.webContents.getPrinters();
    const receiptPrinter = printers.find((p) => p.name === "BTP-M280(U) 1");

    if (!receiptPrinter) {
      throw new Error("Receipt printer not found");
    }

    log("Found receipt printer:", receiptPrinter.name);

    // Create receipt content with dramatically increased font sizes
    const htmlContent = `
      <html>
        <head>
          <style>
            /* Reset ALL default spacing */
            html, body, div, h1, h2, h3, p {
              margin: 0;
              padding: 0;
              border: 0;
            }
            
            html, body {
              height: 100%;
              width: 100%;
              overflow: visible;
            }
    
            /* Base styles with LARGER font size */
            body {
              font-family: monospace;
              width: 280px;
              font-size: 40pt; /* Increased from 30pt */
              line-height: 1.2;
              margin: 0;
              padding: 0;
              overflow: visible;
            }
            
            /* Receipt container to control position */
            #receipt {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              padding: 0;
              margin: 0;
            }
    
            /* Header styling - larger and bolder */
            .header {
              text-align: center;
              font-size: 45pt; /* Increased from 36pt */
              font-weight: bold;
              margin-top: 0;
              padding-top: 0;
            }
    
            /* Utility classes */
            .center { 
              text-align: center; 
            }
            .bold { 
              font-weight: bold; 
            }
            .large-text {
              font-size: 42pt; /* Increased from 34pt */
            }
            .divider { 
              border-top: 3px dashed black; /* Made thicker */
              margin: 10px 0;
            }
    
            /* Item styling */
            .item {
              margin: 10px 0;
              font-size: 38pt; /* Increased from 30pt */
            }
    
            /* Totals section */
            .totals {
              font-size: 40pt; /* Increased from 32pt */
              margin: 10px 0;
            }
    
            /* Footer styling */
            .footer {
              text-align: center;
              font-size: 38pt; /* Increased from 30pt */
              margin: 15px 0;
              padding-bottom: 30px;
            }
          </style>
        </head>
        <body>
          <div id="receipt">
            <div class="header">
              ${businessInfo.name}
              <br>${businessInfo.address.replace("\n", "<br>")}
            </div>
            
            <div class="divider"></div>
            
            <div class="item">
              Date: ${new Date().toLocaleString()}<br>
              Payment: ${saleData.paymentMethod}
            </div>
            
            <div class="divider"></div>
            
            ${
              saleData.services && saleData.services.length > 0
                ? `
              <div class="bold large-text">Services</div>
              ${saleData.services
                .map(
                  (service) => `
                <div class="item">
                  <span class="bold">Service #${service.serviceId}</span>
                  <br>Price: $${service.price.toFixed(2)}
                </div>
              `,
                )
                .join('<div class="divider"></div>')}
              <div class="divider"></div>
            `
                : ""
            }
            
            ${
              saleData.products && saleData.products.length > 0
                ? `
              <div class="bold large-text">Products</div>
              ${saleData.products
                .map(
                  (product) => `
                <div class="item">
                  #${product.inventoryId} (x${product.quantity})
                  <br>Price: $${product.price.toFixed(2)}
                </div>
              `,
                )
                .join('<div class="divider"></div>')}
              <div class="divider"></div>
            `
                : ""
            }
            
            <div class="totals bold">
              Subtotal: $${saleData.subtotal.toFixed(2)}<br>
              Tax: $${saleData.tax.toFixed(2)}<br>
              <div class="large-text">Total: $${saleData.total.toFixed(2)}</div>
            </div>
            
            <div class="divider"></div>
            
            <div class="footer">
              Thank you for your business!
            </div>
          </div>
    
          <script>
            // Calculate the height including all content
            window.addEventListener('DOMContentLoaded', () => {
              const contentHeight = document.getElementById('receipt').scrollHeight;
              window.contentHeight = contentHeight;
              console.log('Content height: ' + contentHeight);
            });
          </script>
        </body>
      </html>
    `;

    log("Loading receipt content...");
    await printWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`,
    );

    // Wait for the content to load and execute the script
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Get the calculated height from the page
    const contentHeight = await printWindow.webContents.executeJavaScript(
      "window.contentHeight",
    );

    log(`Calculated receipt height: ${contentHeight}px`);

    // Convert from pixels to microns (roughly - this conversion factor may need adjustment)
    // A typical conversion is about 3.8 pixels per millimeter, and 1mm = 1000 microns
    const heightInMicrons = Math.ceil((contentHeight / 3.8) * 1000);

    // Add a small buffer to ensure complete printing (3cm or 30000 microns)
    const printHeightWithBuffer = heightInMicrons + 30000;

    log(`Setting print height to: ${printHeightWithBuffer} microns`);

    // Create a promise to handle the print completion
    const printPromise = new Promise((resolve, reject) => {
      printWindow.webContents.print(
        {
          silent: true,
          printBackground: false,
          deviceName: receiptPrinter.name,
          color: false,
          margins: {
            marginType: "none",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
          },
          pageSize: {
            width: 80000, // 80mm in microns
            height: printHeightWithBuffer, // Dynamically calculated height plus buffer
          },
        },
        (success, failureReason) => {
          if (success) {
            log("Print job sent successfully");
            resolve();
          } else {
            log("Print failed:", failureReason);
            reject(new Error(`Printing failed: ${failureReason}`));
          }
        },
      );
    });

    // Wait for print job to be sent
    await printPromise;

    // Give the printer a moment to process before closing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    printWindow.close();
    log("Print window closed after successful print");

    return { success: true };
  } catch (error) {
    log("Error during printing:", error);
    throw error;
  }
});

// Customer Sales Handler
ipcMain.handle(
  "get-customer-sales",
  async (event, { clientId, startDate, endDate }) => {
    try {
      // Get all sales for this client within the date range
      const sales = db
        .get("sales")
        .filter((sale) => {
          const saleDate = new Date(sale.saleDate);
          return (
            sale.ClientId === clientId &&
            saleDate >= new Date(startDate) &&
            saleDate <= new Date(endDate)
          );
        })
        .value();

      // Format the sales data with related information
      const formattedSales = sales.map((sale) => {
        const stylist = db.get("stylists").find({ id: sale.StylistId }).value();
        const saleItems = db
          .get("saleItems")
          .filter({ SaleId: sale.id })
          .value();

        const items = saleItems.map((item) => {
          if (item.itemType === "service") {
            const service = db
              .get("services")
              .find({ id: item.ServiceId })
              .value();
            return {
              type: "service",
              name: service ? service.name : "Unknown Service",
              price: item.price,
              quantity: item.quantity || 1,
            };
          } else {
            const product = db
              .get("inventory")
              .find({ id: item.InventoryId })
              .value();
            return {
              type: "product",
              name: product ? product.productName : "Unknown Product",
              price: item.price,
              quantity: item.quantity || 1,
            };
          }
        });

        return {
          id: sale.id,
          saleDate: sale.saleDate,
          subtotal: sale.subtotal,
          tax: sale.tax,
          total: sale.total,
          paymentMethod: sale.paymentMethod,
          stylist: stylist
            ? `${stylist.firstName} ${stylist.lastName}`
            : "Unknown",
          items,
          isVoided: sale.isVoided, // Add this line
          voidReason: sale.voidReason, // Add this line
        };
      });

      return formattedSales;
    } catch (error) {
      log("Error fetching customer sales:", error);
      throw error;
    }
  },
);

ipcMain.handle("void-sale", async (event, { saleId, voidReason }) => {
  try {
    const sale = db.get("sales").find({ id: saleId });

    if (!sale.value()) {
      throw new Error("Sale not found");
    }

    // Update the sale with void information
    sale
      .assign({
        isVoided: true,
        voidReason: voidReason || null,
        voidedAt: new Date(),
        updatedAt: new Date(),
      })
      .write();

    // If this is a product sale, we may want to return inventory
    const saleItems = db
      .get("saleItems")
      .filter({ SaleId: saleId, itemType: "product" })
      .value();

    // Return products to inventory
    for (const item of saleItems) {
      if (item.InventoryId) {
        const inventoryItem = db
          .get("inventory")
          .find({ id: item.InventoryId });
        if (inventoryItem.value()) {
          // Increase inventory quantity
          inventoryItem
            .assign({
              quantity: inventoryItem.value().quantity + item.quantity,
              updatedAt: new Date(),
            })
            .write();
        }
      }
    }

    return { success: true, sale: sale.value() };
  } catch (error) {
    log("Error voiding sale:", error);
    throw error;
  }
});

// Update Inventory Handler
ipcMain.handle("update-inventory", async (event, itemData) => {
  try {
    const { id, ...updateData } = itemData;

    // Find the inventory item
    const inventoryItem = db.get("inventory").find({ id });

    if (!inventoryItem.value()) {
      throw new Error("Inventory item not found");
    }

    // Update the inventory item with new data
    inventoryItem
      .assign({
        ...updateData,
        // Ensure numeric fields are stored as numbers
        purchasePrice: Number(updateData.purchasePrice),
        salePrice: Number(updateData.salePrice),
        quantity: Number(updateData.quantity),
        updatedAt: new Date(),
      })
      .write();

    return inventoryItem.value();
  } catch (error) {
    log("Error updating inventory item:", error);
    throw error;
  }
});

ipcMain.handle("delete-client", async (event, { id }) => {
  try {
    // First check if client exists
    const client = db.get("clients").find({ id });
    if (!client.value()) {
      throw new Error("Client not found");
    }

    // Check for any sales associated with this client
    const clientSales = db.get("sales").filter({ ClientId: id }).value();

    // if (clientSales.length > 0) {
    //   // Return information about the situation instead of throwing an error
    //   return {
    //     success: false,
    //     hasSales: true,
    //     salesCount: clientSales.length,
    //   };
    // }

    // Instead of removing the client, update the showInUI flag to false
    client
      .assign({
        showInUI: false,
        updatedAt: new Date(),
      })
      .write();

    return {
      success: true,
      message: "Client successfully hidden from UI",
    };
  } catch (error) {
    log("Error hiding client:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// Add a new handler to soft delete (hide) inventory
ipcMain.handle("hide-inventory", async (event, { id }) => {
  try {
    // Check if item exists
    const item = db.get("inventory").find({ id });
    if (!item.value()) {
      throw new Error("Inventory item not found");
    }

    // Instead of removing, update the showInUI flag to false
    item
      .assign({
        showInUI: false,
        updatedAt: new Date(),
      })
      .write();

    return {
      success: true,
      message: "Item successfully hidden from inventory",
    };
  } catch (error) {
    log("Error hiding inventory item:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

ipcMain.handle("restore-inventory", async (event, { id }) => {
  try {
    const item = db.get("inventory").find({ id });
    if (!item.value()) {
      throw new Error("Inventory item not found");
    }

    item
      .assign({
        showInUI: true,
        updatedAt: new Date(),
      })
      .write();

    return {
      success: true,
      message: "Inventory item successfully restored",
    };
  } catch (error) {
    log("Error restoring inventory item:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

ipcMain.handle("get-hidden-inventory", async () => {
  try {
    return db
      .get("inventory")
      .filter({ showInUI: false })
      .orderBy(["productName"], ["asc"])
      .value();
  } catch (error) {
    log("Error fetching hidden inventory:", error);
    throw error;
  }
});

// Database Backup Handlers
ipcMain.handle("create-manual-backup", async () => {
  try {
    const backupPath = createDatabaseBackup();
    return { success: true, backupPath };
  } catch (error) {
    log("Error creating manual backup:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-backup-info", async () => {
  try {
    const oneDrivePath = getOneDrivePath();
    const backupFolder = path.join(oneDrivePath, "SalonBackups");

    if (!fs.existsSync(backupFolder)) {
      return { backupFolder, backupCount: 0, lastBackup: null };
    }

    const files = fs.readdirSync(backupFolder);
    const backupFiles = files.filter(file => file.startsWith('salon-database-') && file.endsWith('.json'));

    let lastBackup = null;
    if (backupFiles.length > 0) {
      const latestFile = backupFiles
        .map(file => ({
          name: file,
          mtime: fs.statSync(path.join(backupFolder, file)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime)[0];

      lastBackup = {
        filename: latestFile.name,
        date: latestFile.mtime
      };
    }

    return {
      backupFolder,
      backupCount: backupFiles.length,
      lastBackup
    };
  } catch (error) {
    log("Error getting backup info:", error);
    throw error;
  }
});
