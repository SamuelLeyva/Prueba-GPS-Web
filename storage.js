// Almacenamiento local de anuncios (fallback para modo file://)
let anunciosLocales = [];

// Guardar anuncio en localStorage
function saveAdLocalStorage(adData) {
    // Generar ID único
    adData.id = 'ad_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    adData.createdAt = new Date().toISOString();
    
    // Obtener anuncios existentes
    const anunciosGuardados = localStorage.getItem('anuncios');
    const anuncios = anunciosGuardados ? JSON.parse(anunciosGuardados) : [];
    
    // Agregar nuevo anuncio
    anuncios.push(adData);
    
    // Guardar en localStorage
    localStorage.setItem('anuncios', JSON.stringify(anuncios));
    
    return adData;
}

// Cargar anuncios desde localStorage
function loadAdsLocalStorage() {
    const anunciosGuardados = localStorage.getItem('anuncios');
    return anunciosGuardados ? JSON.parse(anunciosGuardados) : [];
}

// Eliminar anuncio del localStorage
function deleteAdLocalStorage(adId) {
    const anunciosGuardados = localStorage.getItem('anuncios');
    let anuncios = anunciosGuardados ? JSON.parse(anunciosGuardados) : [];
    
    // Filtrar anuncio a eliminar
    anuncios = anuncios.filter(ad => ad.id !== adId);
    
    // Guardar lista actualizada
    localStorage.setItem('anuncios', JSON.stringify(anuncios));
}