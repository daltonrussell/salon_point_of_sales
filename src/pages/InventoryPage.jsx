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
  Stack,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  QrCodeScanner as ScannerIcon,
  LocalShipping as ReceiveIcon,
  Edit as EditIcon
} from '@mui/icons-material';

const { ipcRenderer } = window.require('electron');

const InventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [newItem, setNewItem] = useState({
    productName: '',
    manufacturer: '',
    purchasePrice: '',
    salePrice: '',
    quantity: '',
    sku: ''
  });
  const [editItem, setEditItem] = useState({
    id: '',
    productName: '',
    manufacturer: '',
    purchasePrice: '',
    salePrice: '',
    quantity: '',
    sku: '',
    createdAt: '',
    updatedAt: ''
  });
  const [receiveInventory, setReceiveInventory] = useState({
    searchSku: '',
    currentQuantity: 0,
    receivedQuantity: '',
    totalAfter: 0,
    productName: '',
    found: false
  });

  useEffect(() => {
    loadInventory();
  }, []);

  // Calculate total after whenever received quantity changes
  useEffect(() => {
    if (receiveInventory.found) {
      // Explicitly convert to numbers using parseInt/Number
      const currentQty = Number(receiveInventory.currentQuantity) || 0;
      const receivedQty = Number(receiveInventory.receivedQuantity) || 0;

      setReceiveInventory(prev => ({
        ...prev,
        totalAfter: currentQty + receivedQty
      }));
    }
  }, [receiveInventory.receivedQuantity]);

  const loadInventory = async () => {
    try {
      const items = await ipcRenderer.invoke('get-all-inventory');
      setInventory(items);
    } catch (error) {
      console.error('Error loading inventory:', error);
      showSnackbar('Error loading inventory', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
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
      showSnackbar('Error searching inventory', 'error');
    }
  };

  const handleSearchSku = async () => {
    try {
      const results = await ipcRenderer.invoke('search-inventory-by-sku', receiveInventory.searchSku);
      if (results && results.length > 0) {
        const item = results[0];
        setReceiveInventory(prev => ({
          ...prev,
          // Explicitly convert to number
          currentQuantity: Number(item.quantity),
          productName: item.productName,
          found: true,
          receivedQuantity: '',
          // Explicitly use Number conversion
          totalAfter: Number(item.quantity)
        }));
      } else {
        showSnackbar('SKU not found', 'error');
        setReceiveInventory(prev => ({
          ...prev,
          currentQuantity: 0,
          productName: '',
          found: false,
          receivedQuantity: '',
          totalAfter: 0
        }));
      }
    } catch (error) {
      console.error('Error searching SKU:', error);
      showSnackbar('Error searching SKU', 'error');
    }
  };

  const handleReceiveSubmit = async () => {
    try {
      await ipcRenderer.invoke('update-inventory-quantity', {
        sku: receiveInventory.searchSku,
        // Make sure to convert to number here too
        quantity: Number(receiveInventory.receivedQuantity)
      });
      showSnackbar('Inventory updated successfully');
      setIsReceiveDialogOpen(false);
      loadInventory();
      setReceiveInventory({
        searchSku: '',
        currentQuantity: 0,
        receivedQuantity: '',
        totalAfter: 0,
        productName: '',
        found: false
      });
    } catch (error) {
      console.error('Error updating inventory:', error);
      showSnackbar('Error updating inventory', 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditItem(prev => ({
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
      showSnackbar('Inventory item added successfully');
    } catch (error) {
      console.error('Error adding inventory item:', error);
      showSnackbar('Error adding inventory item', 'error');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await ipcRenderer.invoke('update-inventory', editItem);
      setIsEditDialogOpen(false);
      loadInventory();
      showSnackbar('Inventory item updated successfully');
    } catch (error) {
      console.error('Error updating inventory item:', error);
      showSnackbar('Error updating inventory item', 'error');
    }
  };

  const handleEditClick = (item) => {
    setEditItem({
      id: item.id,
      productName: item.productName,
      manufacturer: item.manufacturer,
      purchasePrice: item.purchasePrice,
      salePrice: item.salePrice,
      quantity: item.quantity,
      sku: item.sku,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    });
    setIsEditDialogOpen(true);
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
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<ReceiveIcon />}
            onClick={() => setIsReceiveDialogOpen(true)}
          >
            Receive Inventory
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsDialogOpen(true)}
          >
            Add Inventory
          </Button>
        </Stack>
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
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
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
                  <TableCell align="center">
                    <Tooltip title="Edit Item">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditClick(item)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Inventory Dialog */}
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

      {/* Edit Inventory Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleEditSubmit}>
          <DialogTitle>Edit Inventory Item</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'grid', gap: 2, pt: 2 }}>
              <TextField
                label="Product Name"
                name="productName"
                value={editItem.productName}
                onChange={handleEditInputChange}
                fullWidth
                required
              />
              <TextField
                label="Manufacturer"
                name="manufacturer"
                value={editItem.manufacturer}
                onChange={handleEditInputChange}
                fullWidth
                required
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Purchase Price"
                  name="purchasePrice"
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={editItem.purchasePrice}
                  onChange={handleEditInputChange}
                  fullWidth
                  required
                />
                <TextField
                  label="Sale Price"
                  name="salePrice"
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={editItem.salePrice}
                  onChange={handleEditInputChange}
                  fullWidth
                  required
                />
              </Box>
              <TextField
                label="Quantity"
                name="quantity"
                type="number"
                inputProps={{ min: 0 }}
                value={editItem.quantity}
                onChange={handleEditInputChange}
                fullWidth
                required
              />
              <TextField
                label="SKU"
                name="sku"
                value={editItem.sku}
                onChange={handleEditInputChange}
                fullWidth
                required
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Save Changes
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Receive Inventory Dialog */}
      <Dialog
        open={isReceiveDialogOpen}
        onClose={() => setIsReceiveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Receive Inventory</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="Search SKU"
                value={receiveInventory.searchSku}
                onChange={(e) => setReceiveInventory(prev => ({ ...prev, searchSku: e.target.value }))}
                fullWidth
              />
              <Button 
                variant="contained"
                onClick={handleSearchSku}
                sx={{ alignSelf: 'center' }}
              >
                Search
              </Button>
            </Box>
            
            {receiveInventory.found && (
              <>
                <TextField
                  label="Product Name"
                  value={receiveInventory.productName}
                  InputProps={{ readOnly: true }}
                  disabled
                  fullWidth
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Current Quantity"
                    value={receiveInventory.currentQuantity}
                    InputProps={{ readOnly: true }}
                    disabled
                  />
                  <TextField
                    label="Received Quantity"
                    type="number"
                    value={receiveInventory.receivedQuantity}
                    onChange={(e) => setReceiveInventory(prev => ({ 
                      ...prev, 
                      receivedQuantity: e.target.value
                    }))}
                    inputProps={{ min: 1 }}
                    autoFocus
                  />
                  <TextField
                    label="Total After"
                    value={receiveInventory.totalAfter}
                    InputProps={{ readOnly: true }}
                    disabled
                  />
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsReceiveDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleReceiveSubmit}
            variant="contained"
            disabled={!receiveInventory.found || !receiveInventory.receivedQuantity}
          >
            Update Inventory
          </Button>
        </DialogActions>
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