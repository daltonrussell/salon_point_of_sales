import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  Snackbar,
  Alert,
  Collapse,
  IconButton,
  Typography,
  Chip,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon
} from '@mui/icons-material';

const { ipcRenderer } = window.require('electron');

// Row component with expandable details
const CustomerRow = ({ customer, onExpandError }) => {
  const [open, setOpen] = useState(false);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleExpand = async () => {
    if (!open && sales.length === 0) {
      setLoading(true);
      try {
        // The parameters could be adjusted based on your needs
        // Here we're getting all sales from the last year
        const endDate = new Date().toISOString();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);

        const customerSales = await ipcRenderer.invoke('get-customer-sales', {
          clientId: customer.id,
          startDate: startDate.toISOString(),
          endDate
        });
        setSales(customerSales);
      } catch (error) {
        console.error('Error fetching customer sales:', error);
        onExpandError('Failed to load customer sales history');
      } finally {
        setLoading(false);
      }
    }
    setOpen(!open);
  };

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={handleExpand}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {customer.lastName}, {customer.firstName}
        </TableCell>
        <TableCell>{customer.phone || 'N/A'}</TableCell>
        <TableCell>{customer.email || 'N/A'}</TableCell>
        <TableCell>{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Typography variant="h6" gutterBottom component="div">
                Sales History
              </Typography>
              {loading ? (
                <Typography>Loading sales history...</Typography>
              ) : sales.length === 0 ? (
                <Typography color="text.secondary">No sales history found for this customer.</Typography>
              ) : (
                <Box>
                  {sales.map((sale) => (
                    <Box
                      key={sale.id}
                      sx={{
                        mb: 2,
                        p: 2,
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        borderRadius: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {new Date(sale.saleDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            Stylist: {sale.stylist}
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight="bold">
                          Total: ${sale.total.toFixed(2)}
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {sale.items.map((item, idx) => (
                          <Chip
                            key={idx}
                            label={`${item.name} ${item.quantity > 1 ? `(x${item.quantity})` : ''}`}
                            color={item.type === 'service' ? 'primary' : 'success'}
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await ipcRenderer.invoke('get-all-clients');
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      showSnackbar('Error loading customers', 'error');
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
        const results = await ipcRenderer.invoke('search-clients', term);
        setCustomers(results);
      } else {
        loadCustomers();
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      showSnackbar('Error searching customers', 'error');
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <TextField
          placeholder="Search customers..."
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
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={50} /> {/* Expand/collapse column */}
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Customer Since</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  onExpandError={(msg) => showSnackbar(msg, 'error')}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

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

export default CustomersPage;