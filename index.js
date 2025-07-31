import express from "express";
import fetch from "node-fetch";
import { PDFDocument } from "pdf-lib";
import { writeFile } from "fs/promises";

const app = express();

app.get("/", async (req, res) => {
  const images = req.query.image?.split(",").map(url => url.trim()).filter(Boolean);
  if (!images || images.length === 0) {
    return res.status(400).json({ error: "Image URLs required in 'image' query parameter." });
  }

  try {
    const pdfDoc = await PDFDocument.create();

    for (const imageUrl of images) {
      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();
      let image;
      if (imageUrl.endsWith(".png")) {
        image = await pdfDoc.embedPng(buffer);
      } else {
        image = await pdfDoc.embedJpg(buffer);
      }
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }

    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=images.pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    res.status(500).json({ error: "Failed to generate PDF", details: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server running on port", port));
