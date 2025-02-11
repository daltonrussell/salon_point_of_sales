import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  QrCodeScanner as ScannerIcon,
} from '@mui/icons-material';

const { ipcRenderer } = window.require('electron');

const InventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [newItem, setNewItem] = useState({
    productName: '',
    manufacturer: '',
    purchasePrice: '',
    salePrice: '',
    quantity: '',
    sku: ''
  });

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const items = await ipcRenderer.invoke('get-all-inventory');
      setInventory(items);
    } catch (error) {
      console.error('Error loading inventory:', error);
      setSnackbar({
        open: true,
        message: 'Error loading inventory',
        severity: 'error'
      });
    }
  };

  const handleSearch = async (event) => {
    const term = event.target.value;
    setSearchTerm(term);
    
    try {
      if (term) {
        const results = await ipcRenderer.invoke('search-inventory', term);
        setInventory(results);
      } else {
        loadInventory();
      }
    } catch (error) {
      console.error('Error searching inventory:', error);
      setSnackbar({
        open: true,
        message: 'Error searching inventory',
        severity: 'error'
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await ipcRenderer.invoke('create-inventory', newItem);
      setNewItem({
        productName: '',
        manufacturer: '',
        purchasePrice: '',
        salePrice: '',
        quantity: '',
        sku: ''
      });
      setIsDialogOpen(false);
      loadInventory();
      setSnackbar({
        open: true,
        message: 'Inventory item added successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error adding inventory item:', error);
      setSnackbar({
        open: true,
        message: 'Error adding inventory item',
        severity: 'error'
      });
    }
  };

  const handleScanBarcode = () => {
    // TODO: Implement barcode scanning functionality
    alert('Barcode scanning to be implemented');
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <TextField
          placeholder="Search inventory..."
          variant="outlined"
          size="small"
          sx={{ width: 300 }}
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsDialogOpen(true)}
        >
          Add Inventory
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product Name</TableCell>
              <TableCell>Manufacturer</TableCell>
              <TableCell align="right">Purchase Price</TableCell>
              <TableCell align="right">Sale Price</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell>SKU</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No inventory items found
                </TableCell>
              </TableRow>
            ) : (
              inventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell>{item.manufacturer}</TableCell>
                  <TableCell align="right">${parseFloat(item.purchasePrice).toFixed(2)}</TableCell>
                  <TableCell align="right">${parseFloat(item.salePrice).toFixed(2)}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell>{item.sku}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>Add New Inventory Item</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'grid', gap: 2, pt: 2 }}>
              <TextField
                label="Product Name"
                name="productName"
                value={newItem.productName}
                onChange={handleInputChange}
                fullWidth
                required
              />
              <TextField
                label="Manufacturer"
                name="manufacturer"
                value={newItem.manufacturer}
                onChange={handleInputChange}
                fullWidth
                required
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Purchase Price"
                  name="purchasePrice"
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={newItem.purchasePrice}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
                <TextField
                  label="Sale Price"
                  name="salePrice"
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={newItem.salePrice}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Box>
              <TextField
                label="Quantity"
                name="quantity"
                type="number"
                inputProps={{ min: 0 }}
                value={newItem.quantity}
                onChange={handleInputChange}
                fullWidth
                required
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="SKU"
                  name="sku"
                  value={newItem.sku}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
                <IconButton 
                  onClick={handleScanBarcode}
                  sx={{ alignSelf: 'center' }}
                >
                  <ScannerIcon />
                </IconButton>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Add Item</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InventoryPage;