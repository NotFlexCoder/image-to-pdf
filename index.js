import express from "express";
import fetch from "node-fetch";
import { PDFDocument } from "pdf-lib";

const app = express();

app.get("/", async (req, res) => {
  const imageParam = req.query.image;
  const idParam = req.query.id;

  if (imageParam) {
    const encoded = Buffer.from(imageParam).toString("base64url");
    return res.json({ download: `${req.protocol}://${req.get("host")}?id=${encoded}` });
  }

  if (idParam) {
    try {
      const decoded = Buffer.from(idParam, "base64url").toString();
      const images = decoded.split(",").map(url => url.trim()).filter(Boolean);

      if (!images.length) return res.status(400).json({ error: "Invalid image list." });

      const pdfDoc = await PDFDocument.create();

      for (const url of images) {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        let image;
        if (url.endsWith(".png")) {
          image = await pdfDoc.embedPng(buffer);
        } else {
          image = await pdfDoc.embedJpg(buffer);
        }
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      }

      const pdfBytes = await pdfDoc.save();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=images.pdf");
      return res.send(Buffer.from(pdfBytes));
    } catch (err) {
      return res.status(500).json({ error: "Failed to generate PDF", details: err.message });
    }
  }

  res.status(400).json({ error: "Provide either ?image= or ?id=" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server running on port", port));
