// === API PÚBLICA: HTTP.CAT ===
function showCat() {
  const input = document.getElementById("httpCode");
  const code = input.value.trim();
  const container = document.getElementById("catContainer");

  if (!/^\d{3}$/.test(code)) {
    container.innerHTML = `
      <div class="text-center p-8 text-red-500">
        <p>Ingresa un código HTTP válido de 3 cifras (ej. 200, 404, 500)</p>
      </div>
    `;
    return;
  }

  const imgUrl = `https://http.cat/${code}`;

  container.innerHTML = `<p class="text-center p-8 text-gray-600">Cargando imagen del gato... 🐾</p>`;

  const img = new Image();
  img.src = imgUrl;
  img.alt = `Gato HTTP ${code}`;
  img.className = "cat-img";

  img.onload = () => {
    container.innerHTML = "";
    container.appendChild(img);
  };

  img.onerror = () => {
    container.innerHTML = `<p class="text-center text-red-500">No existe imagen asociada al código HTTP ${code}</p>`;
  };
}

// === API PRIVADA (NewsAPI con backend local) ===
async function searchNews() {
  const query = document.getElementById("searchQuery").value.trim();
  const container = document.getElementById("newsResults");

  if (query === "") {
    container.innerHTML = `<p class="text-center text-red-500">Ingresa un tema para buscar noticias </p>`;
    return;
  }

  container.innerHTML = `<p class="text-center text-gray-600">Buscando noticias...</p>`;

  try {
    // Cambié la URL a relativa: '/news?q=...' en lugar de 'http://localhost:3000/news?q=...'
    const response = await fetch(`/news?q=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (!data.articles || data.articles.length === 0) {
      container.innerHTML = `<p class="text-center text-yellow-600">No se encontraron noticias sobre "${query}"</p>`;
      return;
    }

    container.innerHTML = data.articles
      .map(
        (article) => `
      <div class="news-card">
        <h3>${article.title}</h3>
        <p><strong>${article.source.name}</strong> - ${new Date(article.publishedAt).toLocaleDateString()}</p>
        <p>${article.description || "Sin descripción disponible."}</p>
        <a href="${article.url}" target="_blank">Leer más</a>
      </div>
    `
      )
      .join("");
  } catch (error) {
    container.innerHTML = `<p class="text-center text-red-500">Error al cargar noticias 😞</p>`;
    console.error(error);
  }
}

document.getElementById("searchQuery").addEventListener("keypress", function (e) {
  if (e.key === "Enter") searchNews();
});
