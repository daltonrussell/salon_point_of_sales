import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
} from '@mui/material';
const ipc = window.api;

function CustomerModal({ open, onClose, onCustomerAdded, onCustomerUpdated, customerToEdit }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
  });

  // Reset form when modal opens/closes or when customerToEdit changes
  useEffect(() => {
    if (open) {
      if (customerToEdit) {
        setFormData({
          firstName: customerToEdit.firstName || '',
          lastName: customerToEdit.lastName || '',
          phone: customerToEdit.phone || '',
          address: customerToEdit.address || '',
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          phone: '',
          address: '',
        });
      }
    }
  }, [open, customerToEdit]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (customerToEdit) {
        // Update existing customer
        const updatedCustomer = await ipc.invoke('update-client', {
          id: customerToEdit.id,
          ...formData
        });
        onCustomerUpdated(updatedCustomer);
      } else {
        // Create new customer
        const newCustomer = await ipc.invoke('create-client', formData);
        onCustomerAdded(newCustomer);
      }
      onClose();
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  const isEditMode = !!customerToEdit;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                name="firstName"
                label="First Name"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="lastName"
                label="Last Name"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="phone"
                label="Phone Number"
                value={formData.phone}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="address"
                label="Address"
                value={formData.address}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            {isEditMode ? 'Update Customer' : 'Add Customer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default CustomerModal;