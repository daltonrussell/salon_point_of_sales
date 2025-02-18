import React, { useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Sidebar from './components/layout/Sidebar';
import InventoryPage from './pages/InventoryPage';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [selectedItem, setSelectedItem] = useState('sales');

  const handleItemSelect = (itemId) => {
    setSelectedItem(itemId);
  };

  const renderContent = () => {
    switch (selectedItem) {
      case 'inventory':
        return <InventoryPage />;
      case 'sales':
        return <div>Sales Content</div>;
      case 'customers':
        return <div>Customers Content</div>;
      case 'reports':
        return <div>Reports Content</div>;
      case 'settings':
        return <div>Settings Content</div>;
      default:
        return <div>Select a menu item</div>;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Sidebar selectedItem={selectedItem} onItemSelect={handleItemSelect} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            mt: 8,
            ml: `240px`, // Same as DRAWER_WIDTH from Sidebar
          }}
        >
          {renderContent()}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

/**
 * TODO: implement thermal printing
 *
 * For receipt printing in an Electron application with a thermal printer like the SNBC model shown, you'll need to follow a few steps:
 *
 * 1. First, identify the exact printer model - this will help determine which printer commands (usually ESC/POS commands) are supported
 *
 * 2. You'll need to install a Node.js library for receipt printing. Common options include:
 *    - `node-thermal-printer`
 *    - `escpos`
 *    - `printer`
 *
 * Here's a basic example of how you might implement this:
 *
 * 1. First, in your main Electron process (main.js), add printer functionality:
 *
 * ```javascript
 * const { ipcMain } = require('electron');
 * const ThermalPrinter = require('node-thermal-printer').printer;
 * const PrinterTypes = require('node-thermal-printer').types;
 *
 * // Set up printer handling
 * ipcMain.handle('print-receipt', async (event, saleData) => {
 *   try {
 *     let printer = new ThermalPrinter({
 *       type: PrinterTypes.EPSON,  // You'll need to adjust this based on your exact model
 *       interface: 'printer:SNBC'   // You'll need to adjust this to match your printer name
 *     });
 *
 *     // Set up the receipt content
 *     printer.alignCenter();
 *     printer.println("Your Salon Name");
 *     printer.newLine();
 *
 *     printer.alignLeft();
 *     printer.println(`Date: ${new Date().toLocaleString()}`);
 *     printer.println(`Stylist: ${saleData.stylist.firstName} ${saleData.stylist.lastName}`);
 *     printer.println(`Client: ${saleData.client.firstName} ${saleData.client.lastName}`);
 *     printer.drawLine();
 *
 *     // Print items
 *     saleData.cartItems.forEach(item => {
 *       if (item.type === 'service') {
 *         printer.println(`${item.service.name}`);
 *         printer.alignRight();
 *         printer.println(`$${item.price.toFixed(2)}`);
 *         printer.alignLeft();
 *       } else {
 *         printer.println(`${item.product.productName} x${item.quantity}`);
 *         printer.alignRight();
 *         printer.println(`$${item.price.toFixed(2)}`);
 *         printer.alignLeft();
 *       }
 *     });
 *
 *     printer.drawLine();
 *     printer.alignRight();
 *     printer.println(`Subtotal: $${saleData.subtotal.toFixed(2)}`);
 *     printer.println(`Tax: $${saleData.tax.toFixed(2)}`);
 *     printer.println(`Total: $${saleData.total.toFixed(2)}`);
 *     printer.alignLeft();
 *
 *     printer.cut();
 *
 *     await printer.execute();
 *     return { success: true };
 *   } catch (error) {
 *     console.error('Printing error:', error);
 *     return { success: false, error: error.message };
 *   }
 * });
 * ```
 *
 * 2. Then in your SalesForm component, add the print call after a successful sale:
 *
 * ```javascript
 * const handleCompleteSale = async () => {
 *   try {
 *     // Your existing sale completion code...
 *     await ipcRenderer.invoke('create-sale', saleData);
 *
 *     // Add printing
 *     const printResult = await ipcRenderer.invoke('print-receipt', {
 *       stylist: selectedStylist,
 *       client: selectedCustomer,
 *       cartItems,
 *       subtotal,
 *       tax: productTax,
 *       total: subtotal + productTax,
 *       paymentMethod
 *     });
 *
 *     if (!printResult.success) {
 *       console.error('Printing failed:', printResult.error);
 *       // Optionally show error to user
 *     }
 *
 *     // Reset form...
 *     setCartItems([]);
 *     setSelectedCustomer(null);
 *     setSelectedStylist(null);
 *     setPaymentMethod('');
 *
 *     alert('Sale completed successfully!');
 *   } catch (error) {
 *     console.error('Error completing sale:', error);
 *     alert('Error completing sale');
 *   }
 * };
 * ```
 *
 * To get this working, you'll need to:
 *
 * 1. Install the necessary printer library:
 * ```bash
 * npm install node-thermal-printer
 * ```
 *
 * 2. Get the exact model number of your SNBC printer
 * 3. Find out how your system identifies the printer (you might need to use a tool like `printer-list` to get the exact name)
 * 4. Adjust the printer settings in the code accordingly
 *
 * You might also need to:
 * - Test different printer commands to ensure they work with your specific model
 * - Add more receipt customization (logo, footer messages, etc.)
 * - Handle printer errors (out of paper, offline, etc.)
 * - Add a retry mechanism for failed prints
 *
 * Would you like me to help you with any specific part of this implementation?
 */

export default App;