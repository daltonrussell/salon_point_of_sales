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

export default App;