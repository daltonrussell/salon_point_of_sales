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
  Snackbar,
  Alert,
  Stack,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
} from "@mui/icons-material";

const { ipcRenderer } = window.require("electron");

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [newService, setNewService] = useState({
    name: "",
    price: "",
    description: "",
    status: "active",
    luxury: false,
  });
  const [editService, setEditService] = useState({
    id: "",
    name: "",
    price: "",
    description: "",
    status: "active",
    luxury: false, // Add this line
    createdAt: "",
    updatedAt: "",
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const data = await ipcRenderer.invoke("get-services", "all");
      setServices(data);
    } catch (error) {
      console.error("Error loading services:", error);
      showSnackbar("Error loading services", "error");
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
        // Filter services locally since there's likely not many
        const filteredServices = services.filter(
          (service) =>
            service.name.toLowerCase().includes(term.toLowerCase()) ||
            service.description?.toLowerCase().includes(term.toLowerCase()),
        );
        setServices(filteredServices);
      } else {
        loadServices();
      }
    } catch (error) {
      console.error("Error searching services:", error);
      showSnackbar("Error searching services", "error");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewService((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditService((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await ipcRenderer.invoke("create-service", {
        ...newService,
        price: Number(newService.price),
      });
      setNewService({
        name: "",
        price: "",
        description: "",
        status: "active",
      });
      setIsDialogOpen(false);
      loadServices();
      showSnackbar("Service added successfully");
    } catch (error) {
      console.error("Error adding service:", error);
      showSnackbar("Error adding service", "error");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await ipcRenderer.invoke("update-service", {
        ...editService,
        price: Number(editService.price),
      });
      setIsEditDialogOpen(false);
      loadServices();
      showSnackbar("Service updated successfully");
    } catch (error) {
      console.error("Error updating service:", error);
      showSnackbar("Error updating service", "error");
    }
  };

  const handleEditClick = (service) => {
    setEditService({
      id: service.id,
      name: service.name,
      price: service.price,
      description: service.description || "",
      status: service.status,
      luxury: service.luxury || false, // Add this line
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    });
    setIsEditDialogOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const statusColorMap = {
    active: "#4caf50",
    inactive: "#f44336",
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
          placeholder="Search services..."
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
          Add Service
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Service Name</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No services found
                </TableCell>
              </TableRow>
            ) : (
              services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>{service.name}</TableCell>
                  <TableCell align="right">
                    ${parseFloat(service.price).toFixed(2)}
                  </TableCell>
                  <TableCell>{service.description || "N/A"}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: "inline-block",
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: `${statusColorMap[service.status]}20`,
                        color: statusColorMap[service.status],
                        textTransform: "capitalize",
                        fontWeight: "bold",
                      }}
                    >
                      {service.status}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {service.luxury ? (
                      <Box
                        sx={{
                          display: "inline-block",
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: "#9c27b020",
                          color: "#9c27b0",
                          textTransform: "capitalize",
                          fontWeight: "bold",
                        }}
                      >
                        Luxury
                      </Box>
                    ) : (
                      "Standard"
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit Service">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditClick(service)}
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

      {/* Add Service Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>Add New Service</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "grid", gap: 2, pt: 2 }}>
              <TextField
                label="Service Name"
                name="name"
                value={newService.name}
                onChange={handleInputChange}
                fullWidth
                required
              />
              <TextField
                label="Price"
                name="price"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={newService.price}
                onChange={handleInputChange}
                fullWidth
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Description"
                name="description"
                value={newService.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
              />

              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={newService.status}
                  label="Status"
                  onChange={handleInputChange}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Checkbox
                    name="luxury"
                    checked={newService.luxury}
                    onChange={(e) =>
                      setNewService((prev) => ({
                        ...prev,
                        luxury: e.target.checked,
                      }))
                    }
                  />
                }
                label="Luxury Service (taxable)"
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Add Service
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleEditSubmit}>
          <DialogTitle>Edit Service</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "grid", gap: 2, pt: 2 }}>
              <TextField
                label="Service Name"
                name="name"
                value={editService.name}
                onChange={handleEditInputChange}
                fullWidth
                required
              />
              <TextField
                label="Price"
                name="price"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={editService.price}
                onChange={handleEditInputChange}
                fullWidth
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Description"
                name="description"
                value={editService.description}
                onChange={handleEditInputChange}
                fullWidth
                multiline
                rows={3}
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={editService.status}
                  label="Status"
                  onChange={handleEditInputChange}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Checkbox
                    name="luxury"
                    checked={editService.luxury}
                    onChange={(e) =>
                      setEditService((prev) => ({
                        ...prev,
                        luxury: e.target.checked,
                      }))
                    }
                  />
                }
                label="Luxury Service (taxable)"
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

export default ServicesPage;
