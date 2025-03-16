import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Divider,
  Alert,
  Snackbar,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const { ipcRenderer } = window.require("electron");

function StylistManagement() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    status: "active",
  });
  const [stylists, setStylists] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [productStylist, setProductStylist] = useState(() => {
    const savedId = localStorage.getItem("productStylistId");
    return savedId || "";
  });
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const saveProductStylistSetting = () => {
    localStorage.setItem("productStylistId", productStylist);
    setShowSaveSuccess(true);
  };

  const loadStylists = async () => {
    try {
      const data = await ipcRenderer.invoke("get-stylists", statusFilter);
      setStylists(data);
    } catch (error) {
      console.error("Error loading stylists:", error);
    }
  };

  useEffect(() => {
    loadStylists();
  }, [statusFilter]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await ipcRenderer.invoke("update-stylist-status", {
        id,
        status: newStatus,
      });
      loadStylists();
    } catch (error) {
      console.error("Error updating stylist status:", error);
    }
  };

  const handleDelete = async (id) => {
    // Check if this is the product sales stylist before deletion
    if (id === productStylist) {
      alert(
        "This stylist is currently assigned to product sales. Please assign product sales to a different stylist before deleting.",
      );
      return;
    }

    if (window.confirm("Are you sure you want to delete this stylist?")) {
      try {
        await ipcRenderer.invoke("delete-stylist", { id });
        loadStylists();
      } catch (error) {
        console.error("Error deleting stylist:", error);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await ipcRenderer.invoke("create-stylist", formData);
      setFormData({
        firstName: "",
        lastName: "",
        status: "active",
      });
      loadStylists();
    } catch (error) {
      console.error("Error creating stylist:", error);
    }
  };

  return (
    <Box>
      {/* Add Stylist Form */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Add New Stylist
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              name="firstName"
              label="First Name"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              fullWidth
            />
            <TextField
              name="lastName"
              label="Last Name"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              fullWidth
            />
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                label="Status"
                onChange={handleInputChange}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Button type="submit" variant="contained" color="primary">
            Add Stylist
          </Button>
        </Box>
      </Paper>

      {/* Product Sales Attribution */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Product Sales Attribution
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select which stylist should receive credit for all product sales. This
          allows the salon to track product sales separately from service
          revenue.
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <FormControl sx={{ minWidth: 400 }}>
            <InputLabel>Product Sales Stylist</InputLabel>
            <Select
              value={productStylist}
              label="Product Sales Stylist"
              onChange={(e) => setProductStylist(e.target.value)}
            >
              <MenuItem value="">
                <em>None Selected</em>
              </MenuItem>
              {stylists
                .filter((s) => s.status === "active")
                .map((stylist) => (
                  <MenuItem key={stylist.id} value={stylist.id}>
                    {stylist.firstName} {stylist.lastName}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            onClick={saveProductStylistSetting}
          >
            Save
          </Button>
        </Box>
      </Paper>

      {/* Stylists Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Manage Stylists
        </Typography>
        <Box sx={{ mb: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={statusFilter}
              label="Filter by Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>First Name</TableCell>
                <TableCell>Last Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stylists.length > 0 ? (
                stylists.map((stylist) => (
                  <TableRow key={stylist.id}>
                    <TableCell>
                      {stylist.firstName}
                      {stylist.id === productStylist && (
                        <Typography
                          component="span"
                          color="primary"
                          sx={{ ml: 1, fontWeight: "bold" }}
                        >
                          (Product Sales)
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{stylist.lastName}</TableCell>
                    <TableCell>{stylist.status}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          size="small"
                          onClick={() =>
                            handleStatusChange(
                              stylist.id,
                              stylist.status === "active"
                                ? "inactive"
                                : "active",
                            )
                          }
                          disabled={
                            stylist.id === productStylist &&
                            stylist.status === "active"
                          }
                        >
                          {stylist.status === "active"
                            ? "Deactivate"
                            : "Activate"}
                        </Button>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(stylist.id)}
                          disabled={stylist.id === productStylist}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No stylists found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Success notification */}
      <Snackbar
        open={showSaveSuccess}
        autoHideDuration={4000}
        onClose={() => setShowSaveSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setShowSaveSuccess(false)}>
          Product sales attribution saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default StylistManagement;
