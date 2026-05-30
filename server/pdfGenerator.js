import PDFDocument from "pdfkit";

// Format currency as Rs. XX.XX with Indian numbering system
function formatPDFCurrency(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

// Draw the vector brand logo (chef hat) onto the PDF document
function drawBrandHat(doc, x, y, scale = 1, opacity = 1) {
  doc.save();
  doc.translate(x, y);
  doc.scale(scale);
  
  // 1. Hat body
  doc.path("M36 60c0-14 8-20 17-20 2-12 12-18 23-15 5-7 13-11 23-11 15 0 27 10 30 24 8-3 18 3 20 13 11 1 17 7 17 17H36z");
  doc.fillColor("#d0843e");
  doc.fillOpacity(opacity * 0.35);
  doc.fill();
  
  // 2. Base line
  doc.path("M37 60h149");
  doc.strokeColor("#6f3f1e");
  doc.strokeOpacity(opacity * 0.35);
  doc.lineWidth(3);
  doc.stroke();
  
  // 3. Steam lines
  doc.path("M56 42c4 0 7-3 7-7M85 30c5 0 8-3 8-8M121 27c5 0 8-3 8-8");
  doc.strokeColor("#ffffff");
  doc.strokeOpacity(opacity * 0.45);
  doc.lineWidth(2);
  doc.stroke();
  
  doc.restore();
}

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
      // Fill the entire page with the elegant light-cream background gradient
      const bgGradient = doc.linearGradient(0, 0, 595.28, 841.89);
      bgGradient.stop(0, "#fcfbf9");
      bgGradient.stop(1, "#f5f1eb");
      doc.rect(0, 0, 595.28, 841.89).fill(bgGradient);

      // Faint large watermark on the top right
      drawBrandHat(doc, 360, -60, 1.4, 0.03);

      const createdDate = new Date(order.createdAt || Date.now());
      const invoiceNumber = order.invoiceNumber || `INV-${createdDate.getFullYear()}-001`;

      // --- HEADER SECTION ---
      // Brand logo top-left
      drawBrandHat(doc, 40, 40, 0.48, 1);

      // "NAMMA VEETU"
      doc.fillColor("#6f3f1e")
         .fillOpacity(0.7)
         .fontSize(8)
         .font("Helvetica-Bold")
         .text("NAMMA VEETU", 40, 90, { characterSpacing: 1.5 });
         
      // "Anjaraipetti"
      doc.fillColor("#2a1a12")
         .fillOpacity(1)
         .fontSize(30)
         .font("Times-Bold")
         .text("Anjaraipetti", 40, 103, { lineGap: 0 });
         
      // "Premium Kitchen Essentials"
      doc.fillColor("#4b2c1a")
         .fillOpacity(0.8)
         .fontSize(9.5)
         .font("Helvetica")
         .text("Premium Kitchen Essentials", 40, 140);

      // Company details & FSSAI
      doc.fillColor("#4b2c1a")
         .fillOpacity(0.6)
         .fontSize(8)
         .font("Helvetica")
         .text("FSSAI Reg. No: 22426425000511\nPerungalthur, Chennai, Tamilnadu\nContact: Nammaveetuanjaraipetti.support@gmail.com", 40, 158, { lineGap: 2 });

      // Invoice Details (Top Right)
      doc.fillColor("#6f3f1e")
         .fillOpacity(0.6)
         .fontSize(8)
         .font("Helvetica-Bold")
         .text("INVOICE NUMBER", 355, 45, { width: 200, align: "right", characterSpacing: 1.5 });
         
      doc.fillColor("#2a1a12")
         .fillOpacity(1)
         .fontSize(13)
         .font("Courier-Bold")
         .text(invoiceNumber, 355, 57, { width: 200, align: "right" });
         
      doc.fillColor("#6f3f1e")
         .fillOpacity(0.6)
         .fontSize(8)
         .font("Helvetica-Bold")
         .text("INVOICE DATE", 355, 82, { width: 200, align: "right", characterSpacing: 1.5 });
         
      const formattedDate = createdDate.toLocaleDateString("en-IN", {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.fillColor("#2a1a12")
         .fillOpacity(1)
         .fontSize(10)
         .font("Helvetica-Bold")
         .text(formattedDate, 355, 94, { width: 200, align: "right" });

      // Dividers below header
      doc.moveTo(40, 202)
         .lineTo(555.28, 202)
         .strokeColor("#4b2c1a")
         .strokeOpacity(0.15)
         .lineWidth(1)
         .stroke();

      // --- CUSTOMER & PAYMENT DETAILS CARDS ---
      const infoBoxHeight = order.payment.razorpayPaymentId ? 122 : 110;
      const infoTop = 217;

      // 1. Bill To Box (Left Card)
      doc.save();
      doc.roundedRect(40, infoTop, 247.64, infoBoxHeight, 12)
         .fillAndStroke("#ffffff", "#ebdcc8");
      doc.restore();

      // Bill To accent bar
      doc.save();
      doc.rect(55, infoTop + 16, 15, 2)
         .fillColor("#6f3f1e")
         .fillOpacity(0.3)
         .fill();
      doc.restore();
      
      // Bill To text label
      doc.fillColor("#6f3f1e")
         .fillOpacity(1)
         .fontSize(8)
         .font("Helvetica-Bold")
         .text("BILLED TO", 75, infoTop + 13, { characterSpacing: 1 });
         
      // Customer Name
      doc.fillColor("#2a1a12")
         .fontSize(13)
         .font("Times-Bold")
         .text(order.customer.name, 55, infoTop + 27);
         
      // Address & Details text
      let addressText = `${order.customer.phone}\n${order.address.line1}`;
      if (order.address.line2) {
        addressText += `\n${order.address.line2}`;
      }
      addressText += `\n${order.address.city}, ${order.address.state} - ${order.address.pincode}`;
      
      doc.fillColor("#4b2c1a")
         .fillOpacity(0.8)
         .fontSize(8.5)
         .font("Helvetica")
         .text(addressText, 55, infoTop + 45, { lineGap: 3.5, width: 217.64 });

      // 2. Order Details Box (Right Card)
      doc.save();
      doc.roundedRect(307.64, infoTop, 247.64, infoBoxHeight, 12)
         .fillAndStroke("#ffffff", "#ebdcc8");
      doc.restore();

      // Order Details accent bar
      doc.save();
      doc.rect(322.64, infoTop + 16, 15, 2)
         .fillColor("#6f3f1e")
         .fillOpacity(0.3)
         .fill();
      doc.restore();
      
      // Order Details text label
      doc.fillColor("#6f3f1e")
         .fillOpacity(1)
         .fontSize(8)
         .font("Helvetica-Bold")
         .text("ORDER DETAILS", 342.64, infoTop + 13, { characterSpacing: 1 });
         
      const col1X = 322.64;
      const col2X = 437.64;
      
      // Payment Method
      doc.fillColor("#6f3f1e").fillOpacity(0.6).fontSize(7).font("Helvetica-Bold").text("PAYMENT METHOD", col1X, infoTop + 32, { characterSpacing: 0.5 });
      doc.fillColor("#4b2c1a").fillOpacity(1).fontSize(9).font("Helvetica").text(String(order.payment.method).toUpperCase(), col1X, infoTop + 42);
      
      // Payment Status
      doc.fillColor("#6f3f1e").fillOpacity(0.6).fontSize(7).font("Helvetica-Bold").text("PAYMENT STATUS", col2X, infoTop + 32, { characterSpacing: 0.5 });
      doc.fillColor("#4b2c1a").fillOpacity(1).fontSize(9).font("Helvetica").text(order.payment.status, col2X, infoTop + 42);
      
      // Order Status
      doc.fillColor("#6f3f1e").fillOpacity(0.6).fontSize(7).font("Helvetica-Bold").text("ORDER STATUS", col1X, infoTop + 62, { characterSpacing: 0.5 });
      doc.fillColor("#4b2c1a").fillOpacity(1).fontSize(9).font("Helvetica").text(order.status, col1X, infoTop + 72);
      
      // Estimated Delivery
      doc.fillColor("#6f3f1e").fillOpacity(0.6).fontSize(7).font("Helvetica-Bold").text("ESTIMATED DELIVERY", col2X, infoTop + 62, { characterSpacing: 0.5 });
      doc.fillColor("#4b2c1a").fillOpacity(1).fontSize(9).font("Helvetica").text(order.eta || "2-4 business days", col2X, infoTop + 72);
      
      // Transaction ID (if exists)
      if (order.payment.razorpayPaymentId) {
        doc.fillColor("#6f3f1e").fillOpacity(0.6).fontSize(7).font("Helvetica-Bold").text("TRANSACTION ID", col1X, infoTop + 92, { characterSpacing: 0.5 });
        doc.fillColor("#4b2c1a").fillOpacity(1).fontSize(8).font("Courier").text(order.payment.razorpayPaymentId, col1X, infoTop + 100);
      }

      // --- ITEMS TABLE ---
      const tableTop = infoTop + infoBoxHeight + 15;
      const items = order.items || [];
      const tableHeight = 30 + (items.length * 30);

      // Draw table background and border
      doc.save();
      doc.roundedRect(40, tableTop, 515.28, tableHeight, 12)
         .fillAndStroke("#ffffff", "#ebdcc8");
      doc.restore();

      // Draw table header background (clipped to table card)
      doc.save();
      doc.roundedRect(40, tableTop, 515.28, tableHeight, 12).clip();
      doc.rect(40, tableTop, 515.28, 30).fill("#f4eee4");
      doc.restore();

      // Table Header text
      doc.fillColor("#6f3f1e")
         .fillOpacity(1)
         .fontSize(8)
         .font("Helvetica-Bold");
         
      doc.text("ITEM DESCRIPTION", 55, tableTop + 11);
      doc.text("QTY", 320, tableTop + 11, { width: 40, align: "center" });
      doc.text("RATE", 380, tableTop + 11, { width: 75, align: "right" });
      doc.text("AMOUNT", 470, tableTop + 11, { width: 70, align: "right" });

      // Table rows drawing
      let currentY = tableTop + 30;
      items.forEach((item, idx) => {
        if (idx > 0) {
          doc.moveTo(40, currentY)
             .lineTo(555.28, currentY)
             .strokeColor("#ebdcc8")
             .strokeOpacity(0.5)
             .lineWidth(0.5)
             .stroke();
        }
        
        // Item Description
        doc.fillColor("#2a1a12")
           .fillOpacity(1)
           .fontSize(9)
           .font("Helvetica-Bold")
           .text(item.productName, 55, currentY + 10);
           
        // Qty
        doc.fillColor("#4b2c1a")
           .fillOpacity(0.8)
           .fontSize(9)
           .font("Helvetica")
           .text(item.quantity.toString(), 320, currentY + 10, { width: 40, align: "center" });
           
        // Rate
        doc.text(formatPDFCurrency(item.unitPrice), 380, currentY + 10, { width: 75, align: "right" });
        
        // Amount
        doc.fillColor("#2a1a12")
           .fillOpacity(1)
           .font("Helvetica-Bold")
           .text(formatPDFCurrency(item.subtotal), 470, currentY + 10, { width: 70, align: "right" });
           
        currentY += 30;
      });

      // --- TOTALS BLOCK ---
      const totalsY = tableTop + tableHeight + 15;
      const deliveryFee = Number(order.grandTotal || 0) - Number(order.subtotal || 0);
      const hasDeliveryFee = deliveryFee > 0;
      const totalsWidth = 240;
      const totalsHeight = hasDeliveryFee ? 100 : 85;
      const totalsX = 555.28 - totalsWidth;
      
      // Draw totals card
      doc.save();
      doc.roundedRect(totalsX, totalsY, totalsWidth, totalsHeight, 12)
         .fillAndStroke("#ffffff", "#ebdcc8");
      doc.restore();

      // Subtotal label & value
      doc.fillColor("#4b2c1a")
         .fillOpacity(0.8)
         .fontSize(9.5)
         .font("Helvetica")
         .text("Subtotal", totalsX + 15, totalsY + 15);
         
      doc.text(formatPDFCurrency(order.subtotal), totalsX + 120, totalsY + 15, { width: 105, align: "right" });
      
      if (hasDeliveryFee) {
        doc.fillColor("#4b2c1a")
           .fillOpacity(0.8)
           .fontSize(9.5)
           .font("Helvetica")
           .text("Delivery Fee", totalsX + 15, totalsY + 30);
           
        doc.text(formatPDFCurrency(deliveryFee), totalsX + 120, totalsY + 30, { width: 105, align: "right" });
      }

      // Dashed divider line
      const dividerY = hasDeliveryFee ? totalsY + 50 : totalsY + 38;
      doc.save();
      doc.moveTo(totalsX + 15, dividerY)
         .lineTo(totalsX + totalsWidth - 15, dividerY)
         .strokeColor("#ebdcc8")
         .lineWidth(1)
         .dash(4, { space: 4 })
         .stroke();
      doc.restore();
      
      // Total Due label
      const totalDueY = hasDeliveryFee ? totalsY + 60 : totalsY + 48;
      doc.fillColor("#6f3f1e")
         .fillOpacity(0.7)
         .fontSize(7)
         .font("Helvetica-Bold")
         .text("TOTAL DUE", totalsX + 15, totalDueY, { characterSpacing: 0.5 });
         
      // Grand Total label
      const grandTotalLabelY = hasDeliveryFee ? totalsY + 70 : totalsY + 58;
      doc.fillColor("#2a1a12")
         .fillOpacity(1)
         .fontSize(13)
         .font("Times-Bold")
         .text("Grand Total", totalsX + 15, grandTotalLabelY);
         
      // Grand Total value
      const grandTotalValueY = hasDeliveryFee ? totalsY + 64 : totalsY + 52;
      doc.fillColor("#6f3f1e")
         .fontSize(18)
         .font("Times-Bold")
         .text(
           formatPDFCurrency(order.grandTotal || order.total || order.subtotal),
           totalsX + 110,
           grandTotalValueY,
           { width: 115, align: "right" }
         );

      // --- FOOTER ---
      const footerY = 730;
      
      doc.moveTo(40, footerY)
         .lineTo(555.28, footerY)
         .strokeColor("#4b2c1a")
         .strokeOpacity(0.12)
         .lineWidth(1)
         .stroke();
         
      // Logo in footer
      drawBrandHat(doc, 277.64, footerY + 12, 0.22, 0.4);
      
      // "Thank you for choosing authenticity."
      doc.fillColor("#2a1a12")
         .fillOpacity(0.85)
         .fontSize(12)
         .font("Times-Italic")
         .text("Thank you for choosing authenticity.", 40, footerY + 38, { align: "center", width: 515.28 });
         
      // Supporting message
      doc.fillColor("#4b2c1a")
         .fillOpacity(0.6)
         .fontSize(7.5)
         .font("Helvetica-Bold")
         .text("YOUR SUPPORT KEEPS TRADITION ALIVE", 40, footerY + 56, {
           align: "center",
           width: 515.28,
           characterSpacing: 1
         });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

