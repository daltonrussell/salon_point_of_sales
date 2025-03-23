import React, { useState, useEffect } from "react";
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
  DialogContentText,
  Snackbar,
  Alert,
  Stack,
  Tooltip,
  Divider,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
} from "@mui/material";
import {
  Search as SearchIcon,
  QrCodeScanner as ScannerIcon,
  LocalShipping as ReceiveIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Info as InfoIcon,
} from "@mui/icons-material";

const { ipcRenderer } = window.require("electron");

const InventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [editItem, setEditItem] = useState({
    id: "",
    productName: "",
    manufacturer: "",
    purchasePrice: "",
    salePrice: "",
    quantity: "",
    sku: "",
    createdAt: "",
    updatedAt: "",
  });

  // New receive inventory workflow states
  const [receiveStep, setReceiveStep] = useState(0); // 0: search, 1: add/receive
  const [searchSku, setSearchSku] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [receiveQuantity, setReceiveQuantity] = useState("1");

  // New item form state
  const [newItem, setNewItem] = useState({
    productName: "",
    manufacturer: "",
    purchasePrice: "",
    salePrice: "",
    quantity: "",
    sku: "",
  });

  useEffect(() => {
    loadInventory();
  }, []);

  // Reset the receive dialog when opened
  useEffect(() => {
    if (isReceiveDialogOpen) {
      resetReceiveDialog();
    }
  }, [isReceiveDialogOpen]);

  const resetReceiveDialog = () => {
    setReceiveStep(0);
    setSearchSku("");
    setSearchResult(null);
    setSearchError("");
    setShowAddForm(false);
    setReceiveQuantity("1");
    setNewItem({
      productName: "",
      manufacturer: "",
      purchasePrice: "",
      salePrice: "",
      quantity: "",
      sku: "",
    });
  };

  const loadInventory = async () => {
    try {
      const items = await ipcRenderer.invoke("get-all-inventory");
      setInventory(items);
    } catch (error) {
      console.error("Error loading inventory:", error);
      showSnackbar("Error loading inventory", "error");
    }
  };

  const showSnackbar = (message, severity = "success") => {
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
        const results = await ipcRenderer.invoke("search-inventory", term);
        setInventory(results);
      } else {
        loadInventory();
      }
    } catch (error) {
      console.error("Error searching inventory:", error);
      showSnackbar("Error searching inventory", "error");
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const result = await ipcRenderer.invoke("hide-inventory", {
        id: itemToDelete.id,
      });

      if (result.success) {
        showSnackbar("Item removed from inventory", "success");
        loadInventory(); // Refresh inventory list
      } else {
        showSnackbar(
          `Error: ${result.error || "Failed to remove item"}`,
          "error",
        );
      }
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error removing inventory item:", error);
      showSnackbar("Error removing inventory item", "error");
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditItem((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await ipcRenderer.invoke("update-inventory", editItem);
      setIsEditDialogOpen(false);
      loadInventory();
      showSnackbar("Inventory item updated successfully");
    } catch (error) {
      console.error("Error updating inventory item:", error);
      showSnackbar("Error updating inventory item", "error");
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
      updatedAt: item.updatedAt,
    });
    setIsEditDialogOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // NEW RECEIVE INVENTORY WORKFLOW FUNCTIONS

  // Handle SKU search
  const handleSkuSearch = async () => {
    if (!searchSku.trim()) return;

    setIsSearching(true);
    setSearchError("");
    setSearchResult(null);
    setShowAddForm(false);

    try {
      // Try to find an exact match by SKU first
      const results = await ipcRenderer.invoke(
        "search-inventory-by-sku",
        searchSku.trim(),
      );

      if (results && results.length > 0) {
        // Existing product found
        const item = results[0];
        setSearchResult(item);
        setReceiveQuantity("1");
        setShowAddForm(false);
      } else {
        // No existing product, prepare to add new one
        setShowAddForm(true);
        setNewItem({
          productName: "",
          manufacturer: "",
          purchasePrice: "",
          salePrice: "",
          quantity: "0",
          sku: searchSku.trim(),
        });
      }

      setReceiveStep(1); // Move to next step regardless of result
    } catch (error) {
      console.error("Error searching SKU:", error);
      setSearchError("Error searching SKU. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Handle adding new product
  const handleAddNewProduct = async () => {
    try {
      // Validate form
      if (
        !newItem.productName ||
        !newItem.sku ||
        !newItem.salePrice ||
        !newItem.purchasePrice
      ) {
        setSearchError("Please fill all required fields.");
        return;
      }

      const cleanedItem = {
        ...newItem,
        purchasePrice: parseFloat(newItem.purchasePrice),
        salePrice: parseFloat(newItem.salePrice),
        quantity: parseInt(newItem.quantity, 10) || 0,
      };

      await ipcRenderer.invoke("create-inventory", cleanedItem);

      showSnackbar("Product added successfully!");
      setIsReceiveDialogOpen(false);
      loadInventory();
    } catch (error) {
      console.error("Error adding product:", error);
      setSearchError("Error adding product. Please try again.");
    }
  };

  // Handle updating quantity for existing product
  const handleUpdateInventoryQuantity = async () => {
    try {
      if (
        !searchResult ||
        !receiveQuantity ||
        isNaN(parseInt(receiveQuantity, 10)) ||
        parseInt(receiveQuantity, 10) < 1
      ) {
        setSearchError("Please enter a valid quantity (minimum 1).");
        return;
      }

      await ipcRenderer.invoke("update-inventory-quantity", {
        sku: searchResult.sku,
        quantity: parseInt(receiveQuantity, 10),
      });

      showSnackbar("Inventory updated successfully!");
      setIsReceiveDialogOpen(false);
      loadInventory();
    } catch (error) {
      console.error("Error updating inventory quantity:", error);
      setSearchError("Error updating inventory. Please try again.");
    }
  };

  // Handle form changes for new product
  const handleNewItemChange = (e) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleScanBarcode = () => {
    // TODO: Implement barcode scanning functionality
    alert("Barcode scanning to be implemented");
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
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
        {/* Only show Receive Inventory button now */}
        <Button
          variant="contained"
          startIcon={<ReceiveIcon />}
          onClick={() => setIsReceiveDialogOpen(true)}
        >
          Receive Inventory
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
                  <TableCell align="right">
                    ${parseFloat(item.purchasePrice).toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    ${parseFloat(item.salePrice).toFixed(2)}
                  </TableCell>
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
                    <Tooltip title="Remove Item">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(item)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
            <Box sx={{ display: "grid", gap: 2, pt: 2 }}>
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
              <Box
                sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
              >
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

      {/* NEW UNIFIED RECEIVE INVENTORY DIALOG */}
      <Dialog
        open={isReceiveDialogOpen}
        onClose={() => setIsReceiveDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {receiveStep === 0
            ? "Search Product"
            : showAddForm
              ? "Add New Product"
              : "Receive Existing Product"}
        </DialogTitle>

        <DialogContent dividers>
          {/* Step 1: Search */}
          {receiveStep === 0 && (
            <Box sx={{ py: 2 }}>
              <Typography variant="body1" gutterBottom>
                Enter the product SKU to check if it already exists in
                inventory.
              </Typography>

              <Box
                sx={{ display: "flex", gap: 2, alignItems: "center", mt: 2 }}
              >
                <TextField
                  label="Product SKU"
                  value={searchSku}
                  onChange={(e) => setSearchSku(e.target.value)}
                  variant="outlined"
                  fullWidth
                  autoFocus
                />

                <Button
                  variant="contained"
                  onClick={handleSkuSearch}
                  disabled={isSearching || !searchSku.trim()}
                  sx={{ height: "56px", minWidth: "120px" }}
                >
                  {isSearching ? <CircularProgress size={24} /> : "Search"}
                </Button>
              </Box>
            </Box>
          )}

          {/* Step 2: Add or Receive */}
          {receiveStep === 1 && (
            <>
              {/* Error Message */}
              {searchError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {searchError}
                </Alert>
              )}

              {/* Product Found - Update Quantity */}
              {searchResult && !showAddForm && (
                <Box sx={{ py: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {searchResult.productName}
                  </Typography>

                  <Box sx={{ mb: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      SKU: {searchResult.sku}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Manufacturer: {searchResult.manufacturer || "N/A"}
                    </Typography>

                    <Box
                      sx={{
                        mt: 2,
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography>
                        Purchase Price: $
                        {parseFloat(searchResult.purchasePrice).toFixed(2)}
                      </Typography>
                      <Typography>
                        Sale Price: $
                        {parseFloat(searchResult.salePrice).toFixed(2)}
                      </Typography>
                      <Typography fontWeight="bold">
                        Current Stock: {searchResult.quantity}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom>
                    Receive New Inventory
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <TextField
                      label="Quantity to Add"
                      type="number"
                      value={receiveQuantity}
                      onChange={(e) => setReceiveQuantity(e.target.value)}
                      inputProps={{ min: 1 }}
                      sx={{ width: "200px" }}
                      autoFocus
                    />

                    <Typography variant="body1">
                      + {searchResult.quantity} current ={" "}
                      {Number(searchResult.quantity) +
                        Number(receiveQuantity || 0)}{" "}
                      total
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* New Product Form */}
              {showAddForm && (
                <Box sx={{ py: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <InfoIcon color="info" sx={{ mr: 1 }} />
                    <Typography color="info.main">
                      No product found with SKU: {searchSku}. Create a new
                      product.
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        label="Product Name"
                        name="productName"
                        value={newItem.productName}
                        onChange={handleNewItemChange}
                        autoFocus
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Manufacturer"
                        name="manufacturer"
                        value={newItem.manufacturer}
                        onChange={handleNewItemChange}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        label="Purchase Price"
                        name="purchasePrice"
                        type="number"
                        value={newItem.purchasePrice}
                        onChange={handleNewItemChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">$</InputAdornment>
                          ),
                          inputProps: { min: 0, step: 0.01 },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        label="Sale Price"
                        name="salePrice"
                        type="number"
                        value={newItem.salePrice}
                        onChange={handleNewItemChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">$</InputAdornment>
                          ),
                          inputProps: { min: 0, step: 0.01 },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        label="Initial Quantity"
                        name="quantity"
                        type="number"
                        value={newItem.quantity}
                        onChange={handleNewItemChange}
                        InputProps={{
                          inputProps: { min: 0 },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        label="SKU"
                        name="sku"
                        value={newItem.sku}
                        disabled // SKU is pre-filled from search
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          {receiveStep === 0 ? (
            <Button onClick={() => setIsReceiveDialogOpen(false)}>
              Cancel
            </Button>
          ) : (
            <>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => {
                  setReceiveStep(0);
                  setSearchError("");
                }}
              >
                Back
              </Button>

              <Button onClick={() => setIsReceiveDialogOpen(false)}>
                Cancel
              </Button>

              {showAddForm ? (
                <Button
                  variant="contained"
                  onClick={handleAddNewProduct}
                  disabled={
                    !newItem.productName ||
                    !newItem.sku ||
                    !newItem.salePrice ||
                    !newItem.purchasePrice
                  }
                >
                  Add Product
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleUpdateInventoryQuantity}
                  disabled={
                    !searchResult ||
                    !receiveQuantity ||
                    parseInt(receiveQuantity, 10) < 1
                  }
                >
                  Receive Inventory
                </Button>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Remove Inventory Item</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove {itemToDelete?.productName} from
            inventory? This action can be reversed through the admin panel.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InventoryPage;
