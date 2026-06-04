/**
 * SaludGest - Servicio de API REST para Personal Médico
 */

const SPECIALTIES = [
    'Medicina General',
    'Cardiología',
    'Pediatría',
    'Urgencias Médicas',
    'Traumatología',
    'Neurología',
    'Anestesiología',
    'Ginecología'
];

export const DoctorsService = {
    /**
     * Obtiene el listado de médicos de guardia desde la API randomuser.me
     * @returns {Promise<Array>} Lista de médicos formateados
     */
    async getDoctorsOnDuty() {
        try {
            // Consumo de API REST con parámetros seleccionados desde variables de entorno (.env)
            const apiUrl = import.meta.env.VITE_API_DOCTORS_URL;
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor médico.');
            }

            const data = await response.json();

            if (!data || !data.results) {
                throw new Error('Respuesta inválida de la API.');
            }

            // Formatear resultados agregando atributos ficticios de especialidades
            return data.results.map((doc, index) => {
                const specialty = SPECIALTIES[index % SPECIALTIES.length];
                const isAvailable = index % 3 !== 0; // Alternar disponibilidad

                return {
                    id: doc.id.value || `DOC-${index}-${Date.now()}`,
                    name: `${doc.name.title} ${doc.name.first} ${doc.name.last}`,
                    email: doc.email,
                    phone: doc.cell,
                    avatar: doc.picture.large || doc.picture.medium,
                    city: doc.location.city,
                    specialty: specialty,
                    status: isAvailable ? 'Disponible' : 'En Consulta'
                };
            });
        } catch (error) {
            console.error('Error al obtener doctores desde la API REST:', error);
            throw new Error('No se pudo conectar con la API de personal médico. Verifica tu conexión de red.');
        }
    }
};
