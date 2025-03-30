import React from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from "@mui/material";

const StylistServicesTable = ({
  data,
  startDate,
  endDate,
  selectedStylists,
  selectedServices,
}) => {
  // Calculate totals
  const totalServices = data.length;
  const totalRevenue = data.reduce(
    (sum, item) => sum + parseFloat(item.price || 0),
    0,
  );

  // Group services for summary
  const servicesSummary = data.reduce((summary, item) => {
    const serviceName = item.serviceName;
    const price = parseFloat(item.price || 0);

    if (!summary[serviceName]) {
      summary[serviceName] = {
        count: 0,
        revenue: 0,
        clients: {},
      };
    }

    summary[serviceName].count += 1;
    summary[serviceName].revenue += price;

    // Track by client too
    const clientName = item.clientName;
    if (!summary[serviceName].clients[clientName]) {
      summary[serviceName].clients[clientName] = {
        count: 0,
        revenue: 0,
      };
    }

    summary[serviceName].clients[clientName].count += 1;
    summary[serviceName].clients[clientName].revenue += price;

    return summary;
  }, {});

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Stylist Services Report
      </Typography>
      <Typography variant="subtitle2" gutterBottom color="text.secondary">
        {`${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}
      </Typography>

      {selectedStylists && selectedStylists.length > 0 && (
        <Typography variant="body2" gutterBottom>
          Stylists:{" "}
          {selectedStylists
            .map((s) => `${s.firstName} ${s.lastName}`)
            .join(", ")}
        </Typography>
      )}

      {selectedServices && selectedServices.length > 0 && (
        <Typography variant="body2" gutterBottom mb={2}>
          Services: {selectedServices.map((s) => s.name).join(", ")}
        </Typography>
      )}

      {/* Service Summary Section */}
      <Typography variant="h6" gutterBottom mt={4}>
        Service Summary
      </Typography>
      <TableContainer sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Service</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Total Revenue</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(servicesSummary).map(([service, data]) => (
              <TableRow key={service}>
                <TableCell>{service}</TableCell>
                <TableCell align="right">{data.count}</TableCell>
                <TableCell align="right">${data.revenue.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableHead>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell align="right">{totalServices}</TableCell>
              <TableCell align="right">${totalRevenue.toFixed(2)}</TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>

      {/* Client Service Breakdown */}
      <Typography variant="h6" gutterBottom mt={4}>
        Client Service Breakdown
      </Typography>
      <TableContainer sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Service</TableCell>
              <TableCell>Client</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Total Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(servicesSummary).flatMap(([service, data]) =>
              Object.entries(data.clients).map(
                ([client, clientData], index) => (
                  <TableRow key={`${service}-${client}`}>
                    {index === 0 ? (
                      <TableCell rowSpan={Object.keys(data.clients).length}>
                        {service}
                      </TableCell>
                    ) : null}
                    <TableCell>{client}</TableCell>
                    <TableCell align="right">{clientData.count}</TableCell>
                    <TableCell align="right">
                      ${clientData.revenue.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ),
              ),
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Detailed Services List */}
      <Typography variant="h6" gutterBottom mt={4}>
        Detailed Services List
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Stylist</TableCell>
              <TableCell>Client</TableCell>
              <TableCell align="right">Price</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{formatDate(item.saleDate)}</TableCell>
                <TableCell>{item.serviceName}</TableCell>
                <TableCell>{item.stylistName}</TableCell>
                <TableCell>{item.clientName}</TableCell>
                <TableCell align="right">
                  ${parseFloat(item.price).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableHead>
            <TableRow>
              <TableCell colSpan={3}>Totals</TableCell>
              <TableCell align="right">Services: {totalServices}</TableCell>
              <TableCell align="right">
                Revenue: ${totalRevenue.toFixed(2)}
              </TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>
    </Box>
  );
};

// Update the PDF content generation method to include the summary sections
StylistServicesTable.generatePdfContent = (
  data,
  startDate,
  endDate,
  selectedStylists,
  selectedServices,
) => {
  // Calculate totals
  const totalServices = data.length;
  const totalRevenue = data.reduce(
    (sum, item) => sum + parseFloat(item.price || 0),
    0,
  );

  // Group services for summary
  const servicesSummary = data.reduce((summary, item) => {
    const serviceName = item.serviceName;
    const price = parseFloat(item.price || 0);

    if (!summary[serviceName]) {
      summary[serviceName] = {
        count: 0,
        revenue: 0,
        clients: {},
      };
    }

    summary[serviceName].count += 1;
    summary[serviceName].revenue += price;

    // Track by client too
    const clientName = item.clientName;
    if (!summary[serviceName].clients[clientName]) {
      summary[serviceName].clients[clientName] = {
        count: 0,
        revenue: 0,
      };
    }

    summary[serviceName].clients[clientName].count += 1;
    summary[serviceName].clients[clientName].revenue += price;

    return summary;
  }, {});

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Create stylist and service filter text
  const stylistText =
    selectedStylists && selectedStylists.length > 0
      ? `<p>Stylists: ${selectedStylists.map((s) => `${s.firstName} ${s.lastName}`).join(", ")}</p>`
      : "";

  const serviceText =
    selectedServices && selectedServices.length > 0
      ? `<p>Services: ${selectedServices.map((s) => s.name).join(", ")}</p>`
      : "";

  // Generate service summary table
  const serviceSummaryTable = `
    <h3>Service Summary</h3>
    <table>
      <thead>
        <tr>
          <th>Service</th>
          <th class="text-right">Quantity</th>
          <th class="text-right">Total Revenue</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(servicesSummary)
          .map(
            ([service, data]) => `
          <tr>
            <td>${service}</td>
            <td class="text-right">${data.count}</td>
            <td class="text-right">$${data.revenue.toFixed(2)}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
      <tfoot>
        <tr>
          <td>Total</td>
          <td class="text-right">${totalServices}</td>
          <td class="text-right">$${totalRevenue.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>
  `;

  // Generate client breakdown table
  const clientBreakdownTable = `
    <h3>Client Service Breakdown</h3>
    <table>
      <thead>
        <tr>
          <th>Service</th>
          <th>Client</th>
          <th class="text-right">Quantity</th>
          <th class="text-right">Total Amount</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(servicesSummary)
          .flatMap(([service, data]) =>
            Object.entries(data.clients)
              .map(
                ([client, clientData], index) => `
            <tr>
              ${index === 0 ? `<td rowspan="${Object.keys(data.clients).length}">${service}</td>` : ""}
              <td>${client}</td>
              <td class="text-right">${clientData.count}</td>
              <td class="text-right">$${clientData.revenue.toFixed(2)}</td>
            </tr>
          `,
              )
              .join(""),
          )
          .join("")}
      </tbody>
    </table>
  `;

  // Generate the detailed listing table
  const detailedListingTable = `
    <h3>Detailed Services List</h3>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Service</th>
          <th>Stylist</th>
          <th>Client</th>
          <th class="text-right">Price</th>
        </tr>
      </thead>
      <tbody>
        ${data
          .map(
            (item) => `
          <tr>
            <td>${formatDate(item.saleDate)}</td>
            <td>${item.serviceName}</td>
            <td>${item.stylistName}</td>
            <td>${item.clientName}</td>
            <td class="text-right">$${parseFloat(item.price).toFixed(2)}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3">Totals</td>
          <td class="text-right">Services: ${totalServices}</td>
          <td class="text-right">Revenue: $${totalRevenue.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>
  `;

  return `
    <div>
      <h2>Stylist Services Report</h2>
      <p class="subtitle">${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>
      ${stylistText}
      ${serviceText}
      
      ${serviceSummaryTable}
      
      ${clientBreakdownTable}
      
      ${detailedListingTable}
    </div>
  `;
};

export default StylistServicesTable;
