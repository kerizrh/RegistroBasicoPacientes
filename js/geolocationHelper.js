/**
 * SaludGest - Ayudante para la API de Geolocalización
 */

export const GeolocationHelper = {
    /**
     * Obtiene las coordenadas actuales del dispositivo
     * @returns {Promise<{latitude: number, longitude: number}>} Coordenadas del usuario
     */
    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('La geolocalización no está soportada por este navegador.'));
                return;
            }

            const options = {
                enableHighAccuracy: true,
                timeout: 8000, // 8 segundos de tiempo de espera
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
    }
};
