import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Obtener __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

//  Servir archivos estáticos desde public/
app.use(express.static(path.join(__dirname, "public")));

// Log de inicio
if (process.env.NEWS_API_KEY) {
  console.log(` NewsAPI Key configurada: ${process.env.NEWS_API_KEY.slice(0, 8)}...`);
} else {
  console.warn("  NEWS_API_KEY no configurada");
}

//  Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    mensaje: "Servidor funcionando correctamente",
    apiKeyConfigurada: !!process.env.NEWS_API_KEY,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

//  API de Noticias
app.get("/news", async (req, res) => {
  const query = req.query.q;

  if (!query || query.trim() === "") {
    return res.status(400).json({ 
      error: "El parámetro 'q' es obligatorio.",
      ejemplo: "/news?q=tecnologia" 
    });
  }

  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    console.error(" NEWS_API_KEY no configurada");
    return res.status(500).json({ 
      error: "Configuración incompleta",
      mensaje: "NEWS_API_KEY no está configurada"
    });
  }

  try {
    console.log(` Buscando noticias sobre: "${query}"`);

    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
      query
    )}&language=es&pageSize=10&apiKey=${apiKey}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'NewsApp/1.0'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(" Error desde NewsAPI:", data);

      let mensajeError = "Error al obtener noticias";

      if (response.status === 401) {
        mensajeError = "API Key inválida o expirada";
      } else if (response.status === 429) {
        mensajeError = "Límite de solicitudes excedido. Intenta más tarde.";
      } else if (response.status === 426) {
        mensajeError = "Plan gratuito limitado. Actualiza tu cuenta.";
      } else if (data.message) {
        mensajeError = data.message;
      }

      return res.status(response.status).json({ 
        error: mensajeError,
        code: data.code || response.status
      });
    }

    console.log(` Noticias encontradas: ${data.totalResults || 0}`);
    
    res.json({
      success: true,
      totalResults: data.totalResults,
      articles: data.articles,
      query: query
    });

  } catch (error) {
    console.error(" Error interno:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      mensaje: error.message
    });
  }
});

//  HTTP Cat API
app.get("/httpcat/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const statusCode = parseInt(code);
    
    if (isNaN(statusCode) || statusCode < 100 || statusCode > 599) {
      return res.status(400).json({
        error: "Código HTTP inválido",
        ejemplo: "/httpcat/404"
      });
    }

    const imageUrl = `https://http.cat/${code}`;
    
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      return res.status(404).json({
        error: "Imagen no encontrada para este código"
      });
    }

    res.json({
      success: true,
      code: statusCode,
      imageUrl: imageUrl,
      message: `HTTP Status ${statusCode}`
    });

  } catch (error) {
    console.error(" Error en httpcat:", error);
    res.status(500).json({
      error: "Error al obtener imagen",
      mensaje: error.message
    });
  }
});

//  Documentación API
app.get("/api", (req, res) => {
  res.json({
    nombre: "API Grupo 6 - NewsAPI & HTTP Cat",
    version: "1.0.0",
    descripcion: "Backend para consumo de APIs públicas y privadas",
    endpoints: {
      health: {
        metodo: "GET",
        ruta: "/health",
        descripcion: "Verificar estado del servidor"
      },
      news: {
        metodo: "GET",
        ruta: "/news",
        descripcion: "Buscar noticias",
        parametros: {
          q: "término de búsqueda (requerido)"
        },
        ejemplo: "/news?q=tecnologia"
      },
      httpcat: {
        metodo: "GET",
        ruta: "/httpcat/:code",
        descripcion: "Obtener imagen HTTP Cat",
        ejemplo: "/httpcat/404"
      },
      docs: {
        metodo: "GET",
        ruta: "/api",
        descripcion: "Esta documentación"
      }
    },
    ejemplos: [
      "GET /health",
      "GET /news?q=deportes",
      "GET /httpcat/200",
      "GET /api"
    ],
    frontend: "Disponible en /",
    timestamp: new Date().toISOString()
  });
});

//  Servir index.html en la ruta raíz
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Index.html"));
});

//  Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint no encontrado",
    path: req.path,
    metodo: req.method,
    sugerencias: ["/health", "/news?q=tecnologia", "/httpcat/404", "/api"]
  });
});

//  Manejo global de errores
app.use((error, req, res, next) => {
  console.error(" Error no manejado:", error);
  res.status(500).json({
    error: "Error interno del servidor",
    mensaje: error.message,
    path: req.path
  });
});

//  Iniciar servidor
app.listen(PORT, () => {
  console.log("=".repeat(60));
  console.log(" Servidor backend + frontend corriendo");
  console.log("=".repeat(60));
  console.log(` Puerto: ${PORT}`);
  console.log(` Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Frontend: http://localhost:${PORT}`);
  console.log(` Health: http://localhost:${PORT}/health`);
  console.log(` News API: http://localhost:${PORT}/news?q=tecnologia`);
  console.log(` HTTP Cat: http://localhost:${PORT}/httpcat/404`);
  console.log(` API Docs: http://localhost:${PORT}/api`);
  console.log("=".repeat(60) + "\n");
});

// Exportar para Vercel
export default app;