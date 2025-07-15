import React from "react";
import { Button } from "@mui/material";
import StylistSalesTable from "./StylistSalesTable";
import InventoryTaxTable from "./InventoryTaxTable";
import ClientsServedTable from "./ClientsServedTable";
import VoidedSalesTable from "./VoidedSalesTable";
import StylistServicesTable from "./StylistServicesTable";
import LuxurySalesTable from "./LuxurySalesTable";

const PDFTableExport = ({
  data,
  reportType,
  startDate,
  endDate,
  includeVoided,
  selectedStylists,
  selectedServices,
}) => {
  const printToPDF = () => {
    const printWindow = window.open("", "_blank");

    let tableContent = "";

    // Use the appropriate table generator based on report type
    if (reportType === "stylist-sales") {
      tableContent = StylistSalesTable.generatePdfContent(data);
    } else if (reportType === "inventory-tax") {
      tableContent = InventoryTaxTable.generatePdfContent(
        data,
        startDate,
        endDate,
      );
    } else if (reportType === "clients-served") {
      tableContent = ClientsServedTable.generatePdfContent(
        data,
        startDate,
        endDate,
      );
    } else if (reportType === "voided-sales") {
      tableContent = VoidedSalesTable.generatePdfContent(
        data,
        startDate,
        endDate,
      );
    } else if (reportType === "stylist-services") {
      tableContent = StylistServicesTable.generatePdfContent(
        data,
        startDate,
        endDate,
        selectedStylists,
        selectedServices,
      );
    } else if (reportType === "luxury-sales") {
      tableContent = LuxurySalesTable.generatePdfContent(
        data,
        startDate,
        endDate,
      );
    }

    const htmlContent = `
      <html>
        <head>
          <title>Report - ${reportType}</title>
          <style>
            body { 
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            table { 
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td { 
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th { 
              background-color: #f8f9fa;
              font-weight: bold;
            }
            .text-right { 
              text-align: right;
            }
            tfoot tr {
              font-weight: bold;
              background-color: #f8f9fa;
            }
            .subtitle {
              color: #666;
              font-size: 0.9em;
              margin-bottom: 20px;
            }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          ${tableContent}
          <div style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()">Print Report</button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.print();
    };
  };

  return (
    <div style={{ marginTop: "16px" }}>
      <Button
        variant="contained"
        onClick={printToPDF}
        sx={{
          backgroundColor: "#3b82f6",
          "&:hover": {
            backgroundColor: "#2563eb",
          },
        }}
      >
        Print Report
      </Button>
    </div>
  );
};

export default PDFTableExport;
