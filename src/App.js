import React, { useState } from 'react';
import { Box } from '@mui/material';
import Sidebar from './components/layout/Sidebar';
import SalesForm from './components/sales/SalesForm';
import Settings from './components/settings/Settings';
import ReportsModule from './components/reports/ReportsModule';
import InventoryPage from "./pages/InventoryPage";
import CustomersPage from "./pages/CustomersPage";

function App() {
  const [selectedMenuItem, setSelectedMenuItem] = useState('sales');

  const renderContent = () => {
    switch (selectedMenuItem) {
      case 'sales':
        return <SalesForm />;
      case 'customers':
        return <CustomersPage/>;
      case 'inventory':
        return <InventoryPage />;
      case 'reports':
        return <ReportsModule />;
      case 'settings':
        return <Settings />;
      default:
        return <SalesForm />;
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Sidebar
        selectedItem={selectedMenuItem}
        onItemSelect={setSelectedMenuItem}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: `calc(100% - 240px)`,
          bgcolor: '#f5f5f5',
        }}
      >
        <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
          {renderContent()}
        </Box>
      </Box>
    </Box>
  );
}

export default App;