import PDFDocument from "pdfkit";

// Brand colors
const COLORS = {
  espresso: "#3b2a25",
  cocoa: "#8a4a22",
  truffle: "#5c433b",
  almond: "#f2ebd9",
  porcelain: "#fcfcfc",
  lightBorder: "#e5ded6"
};

export function generateInvoicePDF(order) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 0, size: "A4" });
      const buffers = [];
      
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // --- HEADER SECTION ---
      // Background for header
      doc.rect(0, 0, 600, 140).fill(COLORS.espresso);
      
      // Brand Name
      doc.fillColor(COLORS.porcelain).fontSize(32).font("Helvetica-Bold").text("Anjaraipetti", 50, 45);
      doc.fillColor(COLORS.almond).fontSize(12).font("Helvetica").text("Premium Indian Masala", 50, 85);
      
      // Invoice Details (Top Right)
      doc.fillColor(COLORS.porcelain).fontSize(10).font("Helvetica-Bold").text("INVOICE", 400, 45, { align: "right" });
      doc.font("Helvetica").fontSize(10).text(`# ${order.invoiceNumber}`, { align: "right" });
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`, { align: "right" });

      // Reset fill color for the rest of the document
      doc.fillColor(COLORS.truffle);

      // --- CUSTOMER & PAYMENT INFO ---
      const infoTop = 180;
      
      // Bill To Box
      doc.roundedRect(50, infoTop, 240, 110, 8).fillAndStroke(COLORS.porcelain, COLORS.lightBorder);
      doc.fillColor(COLORS.cocoa).fontSize(10).font("Helvetica-Bold").text("BILL TO", 65, infoTop + 15);
      doc.fillColor(COLORS.espresso).fontSize(12).font("Helvetica-Bold").text(order.customer.name, 65, infoTop + 35);
      doc.fillColor(COLORS.truffle).fontSize(10).font("Helvetica").text(order.customer.phone, 65, infoTop + 55);
      doc.text(order.address.line1, 65, infoTop + 70);
      if (order.address.line2) doc.text(order.address.line2, 65, infoTop + 85);
      doc.text(`${order.address.city}, ${order.address.state} - ${order.address.pincode}`, 65, order.address.line2 ? infoTop + 100 : infoTop + 85);
      
      // Payment Box
      doc.roundedRect(305, infoTop, 240, 110, 8).fillAndStroke(COLORS.porcelain, COLORS.lightBorder);
      doc.fillColor(COLORS.cocoa).fontSize(10).font("Helvetica-Bold").text("PAYMENT DETAILS", 320, infoTop + 15);
      doc.fillColor(COLORS.truffle).fontSize(10).font("Helvetica").text(`Method: `, 320, infoTop + 35, { continued: true }).font("Helvetica-Bold").text(String(order.payment.method).toUpperCase());
      
      let payY = infoTop + 55;
      if (order.payment.razorpayPaymentId) {
        doc.font("Helvetica").text(`ID: `, 320, payY, { continued: true }).font("Helvetica-Bold").text(order.payment.razorpayPaymentId);
        payY += 20;
      }
      doc.font("Helvetica").text(`Status: `, 320, payY, { continued: true }).font("Helvetica-Bold").fillColor("#2e7d32").text(order.payment.status);

      // --- ORDER TABLE ---
      const tableTop = 330;
      
      // Table Header Background
      doc.rect(50, tableTop, 495, 30).fill(COLORS.almond);
      
      doc.fillColor(COLORS.cocoa).fontSize(10).font("Helvetica-Bold");
      doc.text("Product", 65, tableTop + 10);
      doc.text("Qty", 300, tableTop + 10, { width: 40, align: "center" });
      doc.text("Price", 360, tableTop + 10, { width: 70, align: "right" });
      doc.text("Subtotal", 450, tableTop + 10, { width: 80, align: "right" });
      
      // Table Row
      const rowY = tableTop + 45;
      doc.fillColor(COLORS.espresso).fontSize(10).font("Helvetica-Bold");
      doc.text(order.productName, 65, rowY);
      
      doc.fillColor(COLORS.truffle).font("Helvetica");
      doc.text(order.quantity.toString(), 300, rowY, { width: 40, align: "center" });
      doc.text(`INR ${order.unitPrice}`, 360, rowY, { width: 70, align: "right" });
      doc.text(`INR ${order.subtotal}`, 450, rowY, { width: 80, align: "right" });
      
      // Table Bottom Border
      doc.moveTo(50, rowY + 25).lineTo(545, rowY + 25).strokeColor(COLORS.lightBorder).stroke();
      
      // --- TOTALS ---
      const totalsY = rowY + 45;
      
      // Totals Box
      doc.roundedRect(305, totalsY, 240, 75, 8).fillAndStroke(COLORS.porcelain, COLORS.lightBorder);
      
      doc.fillColor(COLORS.truffle).fontSize(10).font("Helvetica").text("Subtotal", 320, totalsY + 15);
      doc.text(`INR ${order.subtotal}`, 450, totalsY + 15, { width: 80, align: "right" });
      
      doc.moveTo(320, totalsY + 35).lineTo(530, totalsY + 35).strokeColor(COLORS.lightBorder).stroke();
      
      doc.fillColor(COLORS.espresso).fontSize(14).font("Helvetica-Bold").text("Grand Total", 320, totalsY + 45);
      doc.fillColor(COLORS.cocoa).text(`INR ${order.grandTotal}`, 420, totalsY + 45, { width: 110, align: "right" });

      // --- FOOTER ---
      doc.fillColor(COLORS.truffle).fontSize(10).font("Helvetica-Oblique").text("Thank you for choosing Anjaraipetti!", 50, 750, { align: "center" });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
