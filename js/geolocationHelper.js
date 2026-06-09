/**
 * SaludGest - Ayudante para la API de Geolocalización y OpenStreetMap Nominatim
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export const GeolocationHelper = {
    /**
     * Obtiene las coordenadas actuales del dispositivo
     * @returns {Promise<{latitude: number, longitude: number}>}
     */
    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('La geolocalización no está soportada por este navegador.'));
                return;
            }

            const options = {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 0
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    console.warn('Error detectado en geolocalización:', error);
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            reject(new Error('El usuario rechazó el permiso de ubicación.'));
                            break;
                        case error.POSITION_UNAVAILABLE:
                            reject(new Error('La señal o información de ubicación no está disponible.'));
                            break;
                        case error.TIMEOUT:
                            reject(new Error('Se agotó el tiempo de espera para obtener la ubicación.'));
                            break;
                        default:
                            reject(new Error('Error desconocido al acceder a la ubicación.'));
                    }
                },
                options
            );
        });
    },

    /**
     * Busca coordenadas a partir de una dirección usando Nominatim (OpenStreetMap)
     * @param {string} query - Dirección o lugar a buscar
     * @returns {Promise<{latitude: number, longitude: number, displayName: string}>}
     */
    async searchByAddress(query) {
        if (!query || query.trim().length < 3) {
            throw new Error('Escribe al menos 3 caracteres para buscar.');
        }

        const params = new URLSearchParams({
            q: query.trim(),
            format: 'json',
            limit: 1,
            addressdetails: 0
        });

        const response = await fetch(`${NOMINATIM_URL}?${params}`, {
            headers: { 'Accept-Language': 'es' }
        });

        if (!response.ok) {
            throw new Error('Error al consultar el servicio de mapas.');
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            throw new Error('No se encontraron resultados para esa dirección.');
        }

        return {
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon),
            displayName: data[0].display_name
        };
    }
};
