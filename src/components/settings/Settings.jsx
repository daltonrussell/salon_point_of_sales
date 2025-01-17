import React from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import StylistManagement from './StylistManagement';

function Settings() {
  const [selectedTab, setSelectedTab] = React.useState(0);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <Box>
      <Tabs value={selectedTab} onChange={handleTabChange}>
        <Tab label="Stylists" />
        {/* Add more tabs here as needed */}
      </Tabs>

      <Box sx={{ mt: 3 }}>
        {selectedTab === 0 && <StylistManagement />}
      </Box>
    </Box>
  );
}

export default Settings;