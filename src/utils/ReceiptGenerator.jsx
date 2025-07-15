import { format } from "date-fns";

class ReceiptGenerator {
  static generatePdfContent(saleData, businessInfo) {
    const dateFormatted = format(
      new Date(saleData.saleDate),
      "MM/dd/yyyy h:mm a",
    );
    const paymentMethod = saleData.splitPayment
      ? `${saleData.paymentMethod} / ${saleData.secondaryPaymentMethod}`
      : saleData.paymentMethod;

    // Get stylist name from first service (assuming all services have same stylist)
    let stylistName = "";
    if (
      saleData.services &&
      saleData.services.length > 0 &&
      saleData.services[0].stylistName
    ) {
      stylistName = saleData.services[0].stylistName;
    }

    // Generate service items table rows - without stylist column
    let servicesContent = "";
    if (saleData.services && saleData.services.length > 0) {
      servicesContent = `
        <h3>Services</h3>
        <table class="narrow-table">
          <tbody>
            ${saleData.services
              .map(
                (service) => `
              <tr>
                <td>${service.name || "Service"}</td>
                <td class="text-right">$${parseFloat(service.price).toFixed(2)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      `;
    }

    // Generate product items table rows - with narrower layout
    let productsContent = "";
    if (saleData.products && saleData.products.length > 0) {
      productsContent = `
        <h3>Products</h3>
        <table class="narrow-table">
          <tbody>
            ${saleData.products
              .map(
                (product) => `
              <tr>
                <td class="product-name">${product.name || "Product"}${product.isBackBar ? " (BB)" : ""}</td>
                <td class="text-right">${product.quantity}</td>
                <td class="text-right">$${parseFloat(product.price).toFixed(2)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      `;
    }

    // Generate payment details
    let paymentDetails = "";
    if (saleData.splitPayment && saleData.paymentSplits) {
      paymentDetails = `
        <div class="payment-details">
          <h3>Payment Details</h3>
          <table class="narrow-table">
            <tbody>
              ${saleData.paymentSplits
                .map(
                  (payment) => `
                <tr>
                  <td>${payment.method}</td>
                  <td class="text-right">$${parseFloat(payment.amount).toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;
    } else if (saleData.splitPayment) {
      paymentDetails = `
        <div class="payment-details">
          <h3>Payment Details</h3>
          <table class="narrow-table">
            <tbody>
              <tr>
                <td>${saleData.paymentMethod}</td>
                <td class="text-right">$${(saleData.total - (saleData.secondaryPaymentAmount || 0)).toFixed(2)}</td>
              </tr>
              <tr>
                <td>${saleData.secondaryPaymentMethod}</td>
                <td class="text-right">$${parseFloat(saleData.secondaryPaymentAmount || 0).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    // Determine client display (name or ID)
    let clientDisplay = "";
    if (saleData.clientName) {
      clientDisplay = `<p>Client: ${saleData.clientName}</p>`;
    } else if (saleData.ClientId) {
      clientDisplay = `<p>Client #${saleData.ClientId}</p>`;
    }

    // Stylist display
    let stylistDisplay = "";
    if (stylistName) {
      stylistDisplay = `<p>Stylist: ${stylistName}</p>`;
    }

    // Assemble the full receipt content
    return `
      <div class="receipt">
        <div class="receipt-header">
          <h2>${businessInfo.name}</h2>
          <p>${businessInfo.address.replace("\n", "<br />")}</p>
          <p>Date: ${dateFormatted}</p>
          ${clientDisplay}
          ${stylistDisplay}
          <p>Payment: ${paymentMethod}</p>
        </div>
        
        ${servicesContent}
        
        ${productsContent}
        
        <div class="receipt-totals">
          <table class="narrow-table">
            <tbody>
              <tr>
                <td>Subtotal:</td>
                <td class="text-right">$${parseFloat(saleData.subtotal).toFixed(2)}</td>
              </tr>
              ${
                parseFloat(saleData.tax) > 0
                  ? `
                <tr>
                  <td>Tax:</td>
                  <td class="text-right">$${parseFloat(saleData.tax).toFixed(2)}</td>
                </tr>
              `
                  : ""
              }
              ${
                parseFloat(saleData.tip || 0) > 0
                  ? `
                <tr>
                  <td>Tip:</td>
                  <td class="text-right">$${parseFloat(saleData.tip).toFixed(2)}</td>
                </tr>
              `
                  : ""
              }
              <tr class="total-row">
                <td><strong>Total:</strong></td>
                <td class="text-right"><strong>$${parseFloat(saleData.total).toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        
        ${paymentDetails}
        
        <div class="receipt-footer">
          <p>Thank you for your business!</p>
        </div>
      </div>
    `;
  }
}

export default ReceiptGenerator;
