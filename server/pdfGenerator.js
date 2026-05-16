import PDFDocument from "pdfkit";

// Brand colors
const COLORS = {
  espresso: "#3b2a25",
  cocoa: "#8a4a22",
  truffle: "#5c433b",
  almond: "#f2ebd9",
  porcelain: "#fcfcfc",
  lightBorder: "#e5ded6",
  accent: "#d4af37", // Gold accent
  bgWatermark: "#f5f1eb"
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

      // --- PAGE BACKGROUND ---
      // Fill entire page with a very soft porcelain background
      doc.rect(0, 0, 595.28, 841.89).fill(COLORS.porcelain);

      // Subtle background watermark (bottom right and top left)
      doc.circle(600, 800, 250).fill(COLORS.bgWatermark);
      doc.circle(0, 300, 150).fill(COLORS.bgWatermark);

      // --- HEADER SECTION ---
      // Background for header
      doc.rect(0, 0, 595.28, 160).fill(COLORS.espresso);
      
      // Decorative header patterns
      doc.circle(50, 0, 120).fillOpacity(0.04).fill(COLORS.porcelain);
      doc.circle(450, -20, 150).fillOpacity(0.04).fill(COLORS.porcelain);
      doc.fillOpacity(1); // reset opacity
      
      // Brand Name
      doc.fillColor(COLORS.accent).fontSize(9).font("Helvetica-Bold").text("NAMMA VEETU", 50, 45, { characterSpacing: 2 });
      doc.fillColor(COLORS.porcelain).fontSize(34).font("Helvetica-Bold").text("Anjaraipetti", 50, 60);
      doc.fillColor(COLORS.almond).fontSize(11).font("Helvetica-Oblique").text("Premium Kitchen Essentials", 50, 102);
      
      // Invoice Details (Top Right)
      doc.fillColor(COLORS.accent).fontSize(14).font("Helvetica-Bold").text("INVOICE", 400, 45, { align: "right", characterSpacing: 2 });
      doc.fillColor(COLORS.porcelain).font("Helvetica").fontSize(10).text(`# ${order.invoiceNumber}`, { align: "right" });
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`, { align: "right" });

      // Reset fill color for the rest of the document
      doc.fillColor(COLORS.truffle);

      // --- CUSTOMER & PAYMENT INFO ---
      const infoTop = 200;
      
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
      const tableTop = 350;
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
      doc.moveTo(50, 720).lineTo(545, 720).strokeColor(COLORS.lightBorder).stroke();
      doc.fillColor(COLORS.espresso).fontSize(12).font("Helvetica-Bold").text("Thank you for choosing authenticity.", 50, 740, { align: "center" });
      doc.fillColor(COLORS.truffle).fontSize(9).font("Helvetica").text("Your support keeps tradition alive.", 50, 760, { align: "center" });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
