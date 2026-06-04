import PDFDocument from "pdfkit";

function formatPDFCurrency(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function drawBrandHat(doc, x, y, scale = 1, opacity = 1) {
  doc.save();
  doc.translate(x, y);
  doc.scale(scale);
  
  doc.path("M36 60c0-14 8-20 17-20 2-12 12-18 23-15 5-7 13-11 23-11 15 0 27 10 30 24 8-3 18 3 20 13 11 1 17 7 17 17H36z");
  doc.fillColor("#d0843e");
  doc.fillOpacity(opacity * 0.35);
  doc.fill();
  
  doc.path("M37 60h149");
  doc.strokeColor("#6f3f1e");
  doc.strokeOpacity(opacity * 0.35);
  doc.lineWidth(3);
  doc.stroke();
  
  doc.restore();
}

export function generateBusinessReportPDF(stats, monthLabel) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 0, size: "A4" });
      const buffers = [];
      
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        resolve(Buffer.concat(buffers));
      });

      // --- BACKGROUND ---
      const bgGradient = doc.linearGradient(0, 0, 595.28, 841.89);
      bgGradient.stop(0, "#fcfbf9");
      bgGradient.stop(1, "#f5f1eb");
      doc.rect(0, 0, 595.28, 841.89).fill(bgGradient);

      // Large watermark
      drawBrandHat(doc, 380, -40, 1.2, 0.025);

      // --- HEADER ---
      drawBrandHat(doc, 40, 40, 0.4, 1);
      
      doc.fillColor("#6f3f1e")
         .fillOpacity(0.7)
         .fontSize(7.5)
         .font("Helvetica-Bold")
         .text("BUSINESS ANALYSIS", 40, 85, { characterSpacing: 1.5 });
         
      doc.fillColor("#2a1a12")
         .fillOpacity(1)
         .fontSize(24)
         .font("Times-Bold")
         .text("Anjaraipetti Insights", 40, 96);

      doc.fillColor("#4b2c1a")
         .fillOpacity(0.6)
         .fontSize(9)
         .font("Helvetica")
         .text(`Report Period: ${monthLabel || "All Time"} | Generated: ${new Date().toLocaleDateString("en-IN")}`, 40, 126);

      // Divider
      doc.moveTo(40, 150)
         .lineTo(555.28, 150)
         .strokeColor("#4b2c1a")
         .strokeOpacity(0.12)
         .lineWidth(1)
         .stroke();

      // --- OVERVIEW CARDS ---
      const cardY = 170;
      const cardW = 150;
      const cardH = 80;

      // Card 1: Revenue
      doc.save();
      doc.roundedRect(40, cardY, cardW, cardH, 10).fillAndStroke("#ffffff", "#ebdcc8");
      doc.restore();
      doc.fillColor("#6f3f1e").fontSize(8).font("Helvetica-Bold").text("TOTAL NET REVENUE", 52, cardY + 15);
      doc.fillColor("#2a1a12").fontSize(15).font("Times-Bold").text(formatPDFCurrency(stats.totalRevenue), 52, cardY + 32);
      doc.fillColor("#4b2c1a").fillOpacity(0.5).fontSize(7.5).font("Helvetica").text("Excluding cancelled orders", 52, cardY + 54);

      // Card 2: Orders
      doc.save();
      doc.roundedRect(210, cardY, cardW, cardH, 10).fillAndStroke("#ffffff", "#ebdcc8");
      doc.restore();
      doc.fillColor("#6f3f1e").fillOpacity(1).fontSize(8).font("Helvetica-Bold").text("TOTAL ORDERS PLACED", 222, cardY + 15);
      doc.fillColor("#2a1a12").fontSize(18).font("Times-Bold").text(String(stats.totalOrdersCount), 222, cardY + 32);
      doc.fillColor("#4b2c1a").fillOpacity(0.5).fontSize(7.5).font("Helvetica").text(`Delivered: ${stats.statusCounts?.["Delivered"] || 0} | Cancelled: ${stats.statusCounts?.["Cancelled"] || 0}`, 222, cardY + 54);

      // Card 3: Average Basket (AOV)
      doc.save();
      doc.roundedRect(380, cardY, cardW, cardH, 10).fillAndStroke("#ffffff", "#ebdcc8");
      doc.restore();
      doc.fillColor("#6f3f1e").fillOpacity(1).fontSize(8).font("Helvetica-Bold").text("AVG BASKET SIZE", 392, cardY + 15);
      doc.fillColor("#2a1a12").fontSize(15).font("Times-Bold").text(formatPDFCurrency(stats.averageOrderValue), 392, cardY + 32);
      doc.fillColor("#4b2c1a").fillOpacity(0.5).fontSize(7.5).font("Helvetica").text("Per active customer invoice", 392, cardY + 54);

      // --- SECTION: SALES VELOCITY & TRENDS CHART ---
      const chartTop = 280;
      doc.fillColor("#2a1a12").fillOpacity(1).fontSize(14).font("Times-Bold").text("Monthly Sales Performance", 40, chartTop);
      
      // Draw a clean line chart inside PDF using path coordinates
      const chartH = 120;
      const chartW = 490;
      const chartY = chartTop + 30;
      
      // Draw background chart area
      doc.save();
      doc.roundedRect(40, chartY, chartW, chartH, 10).fillAndStroke("#ffffff", "#ebdcc8");
      doc.restore();

      const monthlyData = stats.monthlyData || [];
      if (monthlyData.length > 0) {
        // Draw trend line
        const maxRev = Math.max(...monthlyData.map(m => m.revenue), 100);
        const points = monthlyData.map((m, idx) => {
          const colWidth = chartW / (monthlyData.length || 1);
          const x = 50 + (idx * colWidth) + (colWidth / 2);
          const y = (chartY + chartH - 20) - ((m.revenue / maxRev) * (chartH - 40));
          return { x, y, label: m.label, rev: m.revenue };
        });

        doc.save();
        doc.strokeColor("#d0843e").lineWidth(2.5);
        points.forEach((p, idx) => {
          if (idx === 0) {
            doc.moveTo(p.x, p.y);
          } else {
            doc.lineTo(p.x, p.y);
          }
        });
        doc.stroke();
        doc.restore();

        // Draw points & labels
        points.forEach(p => {
          doc.save().circle(p.x, p.y, 4).fillColor("#6f3f1e").fill();
          doc.fillColor("#4b2c1a").fontSize(7.5).font("Helvetica-Bold").text(`Rs.${Math.round(p.rev)}`, p.x - 18, p.y - 12, { align: "center", width: 36 });
          doc.fillColor("#6f3f1e").fontSize(7.5).font("Helvetica").text(p.label, p.x - 20, chartY + chartH - 14, { align: "center", width: 40 });
        });
      } else {
        doc.fillColor("#4b2c1a").fillOpacity(0.5).fontSize(9).text("No trend line data recorded for the current range.", 60, chartY + 50);
      }

      // --- SECTION: PERFORMANCE TABLES ---
      const tablesTop = 450;
      const colW = 240;

      // Table 1: Top Selling Products
      doc.fillColor("#2a1a12").fontSize(13).font("Times-Bold").text("Top Performing Spices", 40, tablesTop);
      doc.save();
      doc.roundedRect(40, tablesTop + 20, colW, 160, 10).fillAndStroke("#ffffff", "#ebdcc8");
      doc.restore();

      // Headers
      doc.fillColor("#6f3f1e").fontSize(7.5).font("Helvetica-Bold").text("SPICE BLEND", 52, tablesTop + 32);
      doc.text("UNITS", 185, tablesTop + 32, { width: 35, align: "center" });
      doc.text("SALES", 220, tablesTop + 32, { width: 45, align: "right" });

      let prodY = tablesTop + 48;
      const topProducts = stats.topProducts || [];
      topProducts.forEach((p, idx) => {
        doc.moveTo(40, prodY).lineTo(40 + colW, prodY).strokeColor("#ebdcc8").strokeOpacity(0.4).lineWidth(0.5).stroke();
        
        doc.fillColor("#2a1a12").fontSize(8).font("Helvetica-Bold").text(`${idx + 1}. ${p.name.replace("Namma Veetu Anjaraipetti ", "").substring(0, 18)}`, 52, prodY + 6);
        doc.fillColor("#4b2c1a").fontSize(8).font("Helvetica").text(String(p.quantity), 185, prodY + 6, { width: 35, align: "center" });
        doc.text(`Rs.${Math.round(p.revenue)}`, 220, prodY + 6, { width: 45, align: "right" });
        prodY += 22;
      });

      // Table 2: Top Markets (Geography)
      doc.fillColor("#2a1a12").fontSize(13).font("Times-Bold").text("Top Regional Markets", 305, tablesTop);
      doc.save();
      doc.roundedRect(305, tablesTop + 20, colW, 160, 10).fillAndStroke("#ffffff", "#ebdcc8");
      doc.restore();

      // Headers
      doc.fillColor("#6f3f1e").fontSize(7.5).font("Helvetica-Bold").text("REGION / CITY", 317, tablesTop + 32);
      doc.text("ORDERS", 450, tablesTop + 32, { width: 35, align: "center" });
      doc.text("REVENUE", 485, tablesTop + 32, { width: 45, align: "right" });

      let geoY = tablesTop + 48;
      const topLocations = stats.topLocations || [];
      topLocations.forEach((l, idx) => {
        doc.moveTo(305, geoY).lineTo(305 + colW, geoY).strokeColor("#ebdcc8").strokeOpacity(0.4).lineWidth(0.5).stroke();
        
        doc.fillColor("#2a1a12").fontSize(8).font("Helvetica-Bold").text(`${idx + 1}. ${l.label.split(",")[0].substring(0, 18)}`, 317, geoY + 6);
        doc.fillColor("#4b2c1a").fontSize(8).font("Helvetica").text(String(l.count), 450, geoY + 6, { width: 35, align: "center" });
        doc.text(`Rs.${Math.round(l.revenue)}`, 485, geoY + 6, { width: 45, align: "right" });
        geoY += 22;
      });

      // --- FOOTER ---
      const footerY = 740;
      doc.moveTo(40, footerY)
         .lineTo(555.28, footerY)
         .strokeColor("#4b2c1a")
         .strokeOpacity(0.12)
         .lineWidth(1)
         .stroke();
         
      drawBrandHat(doc, 277, footerY + 12, 0.22, 0.4);
      
      doc.fillColor("#4b2c1a")
         .fillOpacity(0.5)
         .fontSize(8)
         .font("Helvetica-Bold")
         .text("NAMMA VEETU ANJARAIPETTI © 2026 - CONFIDENTIAL BUSINESS ANALYSIS REPORT", 40, footerY + 38, {
           align: "center",
           width: 515.28,
           characterSpacing: 0.5
         });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
