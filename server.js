import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

// Inicialización de Express
const app = express();
const PORT = process.env.PORT || 3000;

// Obtener ruta actual correctamente (para ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir archivos estáticos desde la raíz del proyecto
app.use(express.static(path.join(__dirname, "../"))); // <-- importante para Render

//  Validar existencia de la API Key
if (!process.env.NEWS_API_KEY) {
  console.error("\n ERROR CRÍTICO: Falta configurar NEWS_API_KEY en tu archivo .env");
  console.error("💡 Pasos para solucionarlo:");
  console.error("   1 Copia el archivo `.env.example` a `.env`");
  console.error("   2 Agrega tu API key de NewsAPI como: NEWS_API_KEY=tu_clave_aquí");
  console.error("   3 Reinicia el servidor.\n");
  process.exit(1);
}

console.log(" Variables de entorno cargadas correctamente");
console.log(` NewsAPI Key configurada: ${process.env.NEWS_API_KEY.slice(0, 8)}...\n`);

// Middleware
app.use(cors());

//  Endpoint para buscar noticias
app.get("/news", async (req, res) => {
  const query = req.query.q;

  if (!query || query.trim() === "") {
    return res.status(400).json({ error: "El parámetro 'q' es obligatorio." });
  }

  const apiKey = process.env.NEWS_API_KEY;

  try {
    console.log(` Buscando noticias sobre: "${query}"`);

    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
      query
    )}&language=es&pageSize=5&apiKey=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    // Validar errores específicos de NewsAPI
    if (!response.ok) {
      console.error(" Error desde NewsAPI:", data);

      let mensajeError = "Error al obtener noticias";

      if (response.status === 401) {
        mensajeError = "API Key inválida o expirada. Verifica tu archivo .env";
      } else if (response.status === 429) {
        mensajeError = "Límite de solicitudes excedido. Intenta más tarde.";
      } else if (data.message) {
        mensajeError = data.message;
      }

      return res.status(response.status).json({ error: mensajeError });
    }

    console.log(` Noticias encontradas: ${data.totalResults || 0}`);
    res.json(data);
  } catch (error) {
    console.error(" Error interno en el servidor:", error);
    res.status(500).json({
      error: "Error interno del servidor al obtener noticias",
      detalles: error.message,
    });
  }
});

// 🩺 Endpoint de verificación (Health Check)
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    mensaje: "Servidor funcionando correctamente",
    apiKeyConfigurada: !!process.env.NEWS_API_KEY,
  });
});

//  Servir página principal (desde la raíz)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html")); // <-- ajustado para Render
});

//  Iniciar servidor
app.listen(PORT, () => {
  console.log("=".repeat(60));
  console.log(" Servidor backend corriendo exitosamente");
  console.log("=".repeat(60));
  console.log(` URL principal: http://localhost:${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(` API noticias: http://localhost:${PORT}/news?q=tecnologia`);
  console.log("=".repeat(60) + "\n");
});
