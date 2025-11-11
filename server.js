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

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos
// Intenta primero desde la raíz, si no existe, desde el mismo directorio
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, "../")));
app.use(express.static(path.join(__dirname, "public")));

// ⚠️ IMPORTANTE: En producción no forzamos la salida si falta la API key
// porque Vercel/Render la inyectan después del build
if (!process.env.NEWS_API_KEY && process.env.NODE_ENV !== 'production') {
  console.warn("\n  ADVERTENCIA: NEWS_API_KEY no está configurada");
  console.warn("   Para desarrollo local:");
  console.warn("   1. Copia `.env.example` a `.env`");
  console.warn("   2. Agrega: NEWS_API_KEY=tu_clave_aquí");
  console.warn("   3. Reinicia el servidor\n");
}

if (process.env.NEWS_API_KEY) {
  console.log(" Variables de entorno cargadas correctamente");
  console.log(` NewsAPI Key configurada: ${process.env.NEWS_API_KEY.slice(0, 8)}...\n`);
}

// 🩺 Health Check (PRIMERO - antes que otros endpoints)
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    mensaje: "Servidor funcionando correctamente",
    apiKeyConfigurada: !!process.env.NEWS_API_KEY,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

//  Endpoint para buscar noticias
app.get("/news", async (req, res) => {
  const query = req.query.q;

  if (!query || query.trim() === "") {
    return res.status(400).json({ 
      error: "El parámetro 'q' es obligatorio.",
      ejemplo: "/news?q=tecnologia" 
    });
  }

  const apiKey = process.env.NEWS_API_KEY;

  // Validar API Key
  if (!apiKey) {
    console.error(" NEWS_API_KEY no configurada");
    return res.status(500).json({ 
      error: "Configuración incompleta",
      mensaje: "NEWS_API_KEY no está configurada en el servidor",
      hint: "Configura la variable de entorno NEWS_API_KEY"
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

    // Validar errores específicos de NewsAPI
    if (!response.ok) {
      console.error(" Error desde NewsAPI:", data);

      let mensajeError = "Error al obtener noticias";

      if (response.status === 401) {
        mensajeError = "API Key inválida o expirada. Verifica tu configuración";
      } else if (response.status === 429) {
        mensajeError = "Límite de solicitudes excedido. Intenta más tarde.";
      } else if (response.status === 426) {
        mensajeError = "Plan gratuito de NewsAPI limitado. Actualiza tu cuenta.";
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
    console.error(" Error interno en el servidor:", error);
    res.status(500).json({
      error: "Error interno del servidor al obtener noticias",
      mensaje: error.message
    });
  }
});

//  Endpoint para HTTP Cat (API pública)
app.get("/httpcat/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const statusCode = parseInt(code);
    
    // Validar código HTTP
    if (isNaN(statusCode) || statusCode < 100 || statusCode > 599) {
      return res.status(400).json({
        error: "Código HTTP inválido",
        ejemplo: "/httpcat/404"
      });
    }

    const imageUrl = `https://http.cat/${code}`;
    
    // Verificar si existe la imagen
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      return res.status(404).json({
        error: "Imagen no encontrada para este código HTTP"
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
      error: "Error al obtener imagen HTTP Cat",
      mensaje: error.message
    });
  }
});

//  API Info
app.get("/api", (req, res) => {
  res.json({
    nombre: "API Grupo 6",
    version: "1.0.0",
    endpoints: {
      health: {
        metodo: "GET",
        ruta: "/health",
        descripcion: "Verificar estado del servidor"
      },
      news: {
        metodo: "GET",
        ruta: "/news?q=termino",
        descripcion: "Buscar noticias por término",
        ejemplo: "/news?q=tecnologia"
      },
      httpcat: {
        metodo: "GET",
        ruta: "/httpcat/:code",
        descripcion: "Obtener imagen HTTP Cat",
        ejemplo: "/httpcat/404"
      }
    },
    status: "online",
    timestamp: new Date().toISOString()
  });
});

//  Servir página principal
app.get("/", (req, res) => {
  // Intentar servir index.html desde diferentes ubicaciones
  const posiblesPaths = [
    path.join(__dirname, "index.html"),
    path.join(__dirname, "../index.html"),
    path.join(__dirname, "public", "index.html")
  ];

  for (const filePath of posiblesPaths) {
    try {
      res.sendFile(filePath);
      return;
    } catch (error) {
      continue;
    }
  }

  // Si no encuentra el archivo, devolver JSON
  res.json({
    mensaje: " API Backend funcionando",
    endpoints: [
      "GET /health - Estado del servidor",
      "GET /api - Información de la API",
      "GET /news?q=termino - Buscar noticias",
      "GET /httpcat/:code - HTTP Cat"
    ],
    docs: "/api"
  });
});

//  Manejo de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint no encontrado",
    path: req.path,
    metodo: req.method,
    sugerencias: ["/health", "/news?q=tecnologia", "/httpcat/404", "/api"]
  });
});

//  Manejo de errores global
app.use((error, req, res, next) => {
  console.error(" Error no manejado:", error);
  res.status(500).json({
    error: "Error interno del servidor",
    mensaje: error.message,
    path: req.path
  });
});

//  Iniciar servidor (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log("=".repeat(60));
    console.log(" Servidor backend corriendo exitosamente");
    console.log("=".repeat(60));
    console.log(` URL principal: http://localhost:${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/health`);
    console.log(` API noticias: http://localhost:${PORT}/news?q=tecnologia`);
    console.log(` HTTP Cat: http://localhost:${PORT}/httpcat/404`);
    console.log(` API Info: http://localhost:${PORT}/api`);
    console.log("=".repeat(60) + "\n");
  });
}

//  Exportar app para Vercel
export default app;