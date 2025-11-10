import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validar que la API key esté configurada
if (!process.env.NEWS_API_KEY) {
  console.error(" ERROR CRÍTICO: NEWS_API_KEY no está configurada en el archivo .env");
  console.error("ℹPasos para solucionar:");
  console.error("   1. Copia .env.example a .env");
  console.error("   2. Agrega tu API key de NewsAPI en el archivo .env");
  console.error("   3. Reinicia el servidor");
  process.exit(1);
}

console.log("Variables de entorno cargadas correctamente");
console.log(`NewsAPI Key configurada: ${process.env.NEWS_API_KEY.substring(0, 8)}...`);

// Middleware
app.use(cors());
app.use(express.static(__dirname));

// Endpoint para buscar noticias (API privada protegida)
app.get("/news", async (req, res) => {
  const query = req.query.q;
  
  // Validar que se envió un query
  if (!query || query.trim() === "") {
    return res.status(400).json({ 
      error: "El parámetro 'q' (query) es requerido" 
    });
  }

  const apiKey = process.env.NEWS_API_KEY;

  try {
    console.log(` Buscando noticias sobre: "${query}"`);
    
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=es&pageSize=5&apiKey=${apiKey}`;
    
    const response = await fetch(url);
    
    // Manejar errores de NewsAPI
    if (!response.ok) {
      const errorData = await response.json();
      console.error(" Error de NewsAPI:", errorData);
      
      // Mensajes de error más descriptivos
      if (response.status === 401) {
        return res.status(401).json({ 
          error: "API Key inválida o expirada. Verifica tu configuración en .env" 
        });
      }
      if (response.status === 429) {
        return res.status(429).json({ 
          error: "Límite de requests excedido. Intenta más tarde." 
        });
      }
      
      return res.status(response.status).json({ 
        error: errorData.message || "Error al obtener noticias" 
      });
    }
    
    const data = await response.json();
    
    // Log para debugging
    console.log(` Noticias encontradas: ${data.totalResults || 0}`);
    
    res.json(data);
    
  } catch (error) {
    console.error("Error en el servidor:", error);
    res.status(500).json({ 
      error: "Error interno del servidor al obtener noticias",
      details: error.message 
    });
  }
});

// Endpoint de health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Servidor funcionando correctamente",
    apiKeyConfigured: !!process.env.NEWS_API_KEY
  });
});

// Servir el archivo principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Index.html"));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log("\n" + "=".repeat(50));
  console.log("Servidor backend corriendo exitosamente");
  console.log("=".repeat(50));
  console.log(`URL principal: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API de noticias: http://localhost:${PORT}/news?q=tecnologia`);
  console.log("=".repeat(50) + "\n");
});