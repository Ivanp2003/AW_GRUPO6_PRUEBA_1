// Funcionalidad para la api de gato
function showCat() {
    const httpCode = document.getElementById('httpCode').value;
    const container = document.getElementById('catContainer');
    
    if (httpCode) {
        const imageUrl = `https://http.cat/${httpCode}`;
        container.innerHTML = `
            <img 
                src="${imageUrl}" 
                alt="HTTP Cat ${httpCode}"
                class="max-w-full max-h-[400px] object-contain rounded-lg fade-in"
                onerror="this.parentElement.innerHTML='<div class=\\'text-center p-8\\'><p style=\\'color: hsl(var(--muted-foreground))\\'>Error: Código HTTP no válido o imagen no encontrada</p></div>'"
            />
        `;
    }
}

// Ingrese la clave de soporte para HTTP Cat
document.getElementById('httpCode').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        showCat();
    }
});

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
