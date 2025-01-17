import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
const { ipcRenderer } = window.require('electron');

function StylistManagement() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    status: 'active'
  });
  const [stylists, setStylists] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');

  const loadStylists = async () => {
    try {
      const data = await ipcRenderer.invoke('get-stylists', statusFilter);
      setStylists(data);
    } catch (error) {
      console.error('Error loading stylists:', error);
    }
  };

  useEffect(() => {
    loadStylists();
  }, [statusFilter]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await ipcRenderer.invoke('update-stylist-status', { id, status: newStatus });
      loadStylists();
    } catch (error) {
      console.error('Error updating stylist status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this stylist?')) {
      try {
        await ipcRenderer.invoke('delete-stylist', { id });
        loadStylists();
      } catch (error) {
        console.error('Error deleting stylist:', error);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await ipcRenderer.invoke('create-stylist', formData);
      setFormData({
        firstName: '',
        lastName: '',
        status: 'active'
      });
      loadStylists();
    } catch (error) {
      console.error('Error creating stylist:', error);
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
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
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
                    <TableCell>{stylist.firstName}</TableCell>
                    <TableCell>{stylist.lastName}</TableCell>
                    <TableCell>{stylist.status}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          onClick={() => handleStatusChange(stylist.id, 
                            stylist.status === 'active' ? 'inactive' : 'active'
                          )}
                        >
                          {stylist.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(stylist.id)}
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
    </Box>
  );
}

export default StylistManagement;