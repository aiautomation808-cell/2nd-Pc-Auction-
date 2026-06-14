import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const BIDS_FILE = path.join(process.cwd(), "bids.json");

  function getBids() {
    if (!fs.existsSync(BIDS_FILE)) return [];
    try {
      const data = fs.readFileSync(BIDS_FILE, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }

  function saveBids(bids: any[]) {
    fs.writeFileSync(BIDS_FILE, JSON.stringify(bids, null, 2));
  }

  // API Routes
  app.get("/api/bids", (req, res) => {
    res.json(getBids());
  });

  app.post("/api/bids", (req, res) => {
    const bids = getBids();
    const newBid = { 
      ...req.body, 
      id: Date.now().toString(), 
      time: new Date().toISOString() 
    };
    bids.push(newBid);
    saveBids(bids);
    res.json(newBid);
  });

  app.delete("/api/bids/:id", (req, res) => {
    let bids = getBids();
    bids = bids.filter((b: any) => b.id !== req.params.id);
    saveBids(bids);
    res.json({ success: true });
  });

  app.delete("/api/bids", (req, res) => {
    saveBids([]);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
