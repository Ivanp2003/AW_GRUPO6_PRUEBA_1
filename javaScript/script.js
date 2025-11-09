// Funcionalidad para la api de gato
function showCat() {
  const input = document.getElementById("httpCode");
  const code = input.value.trim();
  const container = document.getElementById("catContainer");

  // Verificamos que el usuario haya ingresado un número válido de tres cifras
  if (!/^\d{3}$/.test(code)) {
    container.innerHTML = `
      <div class="text-center p-8 text-red-500">
        <p>Ingresa un código HTTP válido de 3 cifras (ej. 200, 404, 500)</p>
      </div>
    `;
    return;
  }

  const imgUrl = `https://http.cat/${code}`; //Dirección para consumir la API pública

  // Mostramos un loader mientras carga la imagen
  container.innerHTML = `
    <div class="text-center p-8">
      <p class="text-muted-foreground">Cargando imagen del gato... 🐾</p>
    </div>
  `;

  // Creamos una imagen y verificamos si existe
  const img = new Image();
  img.src = imgUrl;
  img.alt = `Gato HTTP ${code}`;
  img.className = "max-w-full rounded-lg shadow-md mx-auto";

  img.onload = () => {
    container.innerHTML = "";
    container.appendChild(img);
  };

  img.onerror = () => {
    container.innerHTML = `
      <div class="text-center p-8 text-red-500">
        <p>No existe imagen asociada al código HTTP ${code}</p>
      </div>
    `;
  };
}

// Funcionalidad NewsAPI (placeholder)
function searchNews() {
  const query = document.getElementById('searchQuery').value;
  console.log('Searching for:', query);

  // La llamada API se implementará más adelante
}

// Ingrese la clave de soporte para NewsAPI
document.getElementById('searchQuery').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    searchNews();
  }
});
