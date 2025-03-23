import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Autocomplete,
  Divider,
  Alert,
} from "@mui/material";

const { ipcRenderer } = window.require("electron");

function ProductAttributionManagement() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [attributedProducts, setAttributedProducts] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");

  // Load all products and already attributed products
  useEffect(() => {
    loadProducts();
    loadAttributedProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await ipcRenderer.invoke("get-all-inventory");
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const loadAttributedProducts = () => {
    // Get attributed products from localStorage
    const savedProducts = localStorage.getItem("attributedProducts");
    if (savedProducts) {
      setAttributedProducts(JSON.parse(savedProducts));
    }
  };

  const handleAddProduct = () => {
    if (!selectedProduct) return;

    // Check if product already exists in the list
    const exists = attributedProducts.some((p) => p.id === selectedProduct.id);
    if (exists) {
      setSuccessMessage("This product is already in the list");
      setTimeout(() => setSuccessMessage(""), 3000);
      return;
    }

    // Add the product to the attributed products list
    const newList = [...attributedProducts, selectedProduct];
    setAttributedProducts(newList);

    // Save to localStorage
    localStorage.setItem("attributedProducts", JSON.stringify(newList));

    // Reset selection and show success message
    setSelectedProduct(null);
    setSuccessMessage("Product added to stylist attribution");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleRemoveProduct = (productId) => {
    // Remove the product from the list
    const newList = attributedProducts.filter((p) => p.id !== productId);
    setAttributedProducts(newList);

    // Update localStorage
    localStorage.setItem("attributedProducts", JSON.stringify(newList));

    // Show success message
    setSuccessMessage("Product removed from stylist attribution");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Product-to-Stylist Attribution
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Products added to this list will be attributed to the service stylist
        instead of the house/product stylist when sold.
      </Typography>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={9}>
          <Autocomplete
            options={products}
            getOptionLabel={(option) =>
              option ? `${option.productName} (SKU: ${option.sku})` : ""
            }
            value={selectedProduct}
            onChange={(event, newValue) => setSelectedProduct(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Product"
                fullWidth
                placeholder="Start typing to search products..."
              />
            )}
          />
        </Grid>
        <Grid item xs={3}>
          <Button
            variant="contained"
            onClick={handleAddProduct}
            disabled={!selectedProduct}
            fullWidth
          >
            Add Product
          </Button>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Products Attributed to Stylists:
        </Typography>
        {attributedProducts.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No products added yet. Products added here will be attributed to the
            service stylist.
          </Typography>
        ) : (
          <List
            sx={{
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            {attributedProducts.map((product) => (
              <React.Fragment key={product.id}>
                <ListItem
                  secondaryAction={
                    <Button
                      color="error"
                      onClick={() => handleRemoveProduct(product.id)}
                      size="small"
                    >
                      Remove
                    </Button>
                  }
                >
                  <ListItemText
                    primary={product.productName}
                    secondary={`SKU: ${product.sku}`}
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
}

export default ProductAttributionManagement;
