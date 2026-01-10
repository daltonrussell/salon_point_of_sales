import React from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import StylistManagement from './StylistManagement';
import TaxManagement from './TaxManagement';
import packageJson from '../../../package.json';

function Settings() {
  const [selectedTab, setSelectedTab] = React.useState(0);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <Box>
      <Tabs value={selectedTab} onChange={handleTabChange}>
        <Tab label="Stylists" />
        <Tab label="Tax Rate" />
      </Tabs>

      <Box sx={{ mt: 3 }}>
        {selectedTab === 0 && <StylistManagement />}
        {selectedTab === 1 && <TaxManagement />}  {/* Changed from 0 to 1 */}
      </Box>

      <Box sx={{ mt: 6, pt: 3, borderTop: '1px solid #e0e0e0' }}>
        <Typography variant="caption" color="textSecondary">
          Version: {packageJson.version}
        </Typography>
      </Box>
    </Box>
  );
}

export default Settings;