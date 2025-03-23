import React from "react";
import { Box, Tab, Tabs } from "@mui/material";
import StylistManagement from "./StylistManagement";
import TaxManagement from "./TaxManagement";
import ProductAttributionManagement from "./ProductAttributionManagement"; // Import the new component

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
        <Tab label="Product Attribution" /> {/* New tab */}
      </Tabs>

      <Box sx={{ mt: 3 }}>
        {selectedTab === 0 && <StylistManagement />}
        {selectedTab === 1 && <TaxManagement />}
        {selectedTab === 2 && <ProductAttributionManagement />}{" "}
        {/* New component */}
      </Box>
    </Box>
  );
}

export default Settings;
