import PDFDocument from "pdfkit";

export function generateInvoicePDF(order) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc.fontSize(20).text("Anjaraipetti", { align: "left" });
      doc.fontSize(10).text("Premium Indian Masala", { align: "left" });
      
      doc.moveUp(2);
      doc.fontSize(10).text(`Invoice Number: ${order.invoiceNumber}`, { align: "right" });
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, { align: "right" });
      
      doc.moveDown(2);
      
      // Billing Details
      const billingTop = doc.y;
      
      doc.fontSize(12).text("Bill To:", 50, billingTop);
      doc.fontSize(10).text(order.customer.name);
      doc.text(order.customer.phone);
      doc.text(order.address.line1);
      if (order.address.line2) doc.text(order.address.line2);
      doc.text(`${order.address.city}, ${order.address.state} - ${order.address.pincode}`);
      
      // Payment Details
      doc.fontSize(12).text("Payment:", 300, billingTop);
      doc.fontSize(10).text(`Method: ${String(order.payment.method).toUpperCase()}`, 300, doc.y);
      if (order.payment.razorpayPaymentId) {
        doc.text(`Payment ID: ${order.payment.razorpayPaymentId}`, 300, doc.y);
      }
      doc.text(`Status: ${order.payment.status}`, 300, doc.y);
      
      doc.moveDown(3);

      // Order Table Header
      const tableTop = doc.y;
      doc.font("Helvetica-Bold");
      doc.text("Product", 50, tableTop);
      doc.text("Quantity", 300, tableTop, { width: 50, align: "center" });
      doc.text("Price", 380, tableTop, { width: 50, align: "right" });
      doc.text("Total", 450, tableTop, { width: 50, align: "right" });
      
      doc.moveTo(50, doc.y + 5).lineTo(500, doc.y + 5).stroke();
      doc.moveDown(1);
      
      // Order Table Row
      doc.font("Helvetica");
      const rowY = doc.y;
      doc.text(order.productName, 50, rowY);
      doc.text(order.quantity.toString(), 300, rowY, { width: 50, align: "center" });
      doc.text(`INR ${order.unitPrice}`, 380, rowY, { width: 50, align: "right" });
      doc.text(`INR ${order.subtotal}`, 450, rowY, { width: 50, align: "right" });
      
      doc.moveTo(50, doc.y + 10).lineTo(500, doc.y + 10).stroke();
      doc.moveDown(2);
      
      // Totals
      doc.font("Helvetica-Bold");
      doc.text(`Grand Total: INR ${order.grandTotal}`, { align: "right" });

      doc.moveDown(4);
      doc.font("Helvetica").text("Thank you for your purchase!", { align: "center" });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
