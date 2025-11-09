import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();


const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.static(__dirname));

app.get("/news", async (req, res) => {
  const query = req.query.q;
  const apiKey = process.env.NEWS_API_KEY;

  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        query
      )}&language=es&pageSize=5&apiKey=${apiKey}`
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener noticias" });
  }
});

app.listen(PORT, () =>
  console.log(`✅ Servidor backend corriendo en http://localhost:${PORT}`)
);
