import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import {
  PointOfSale,
  People,
  Inventory,
  Settings,
  Assessment,
  ContentCut
} from '@mui/icons-material';

const DRAWER_WIDTH = 240;

const menuItems = [
  { text: 'Sales', icon: <PointOfSale />, id: 'sales' },
  { text: 'Customers', icon: <People />, id: 'customers' },
  { text: 'Inventory', icon: <Inventory />, id: 'inventory' },
  { text: 'Services', icon: <ContentCut />, id: 'services' },
  { text: 'Reports', icon: <Assessment />, id: 'reports' },
  { text: 'Settings', icon: <Settings />, id: 'settings' },
];

function Sidebar({ selectedItem, onItemSelect }) {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      <List sx={{ mt: 8 }}>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={selectedItem === item.id}
              onClick={() => onItemSelect(item.id)}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

export default Sidebar;