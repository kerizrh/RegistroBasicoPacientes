/**
 * SaludGest - Servicio de CRUD de Pacientes y Persistencia Local
 */

const STORAGE_KEY = 'saludgest_patients';

export const PatientService = {
    /**
     * Obtiene todos los pacientes registrados en LocalStorage
     * @returns {Array} Lista de pacientes
     */
    getAll() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error al leer pacientes de localStorage:', error);
            throw new Error('No se pudo acceder a la base de datos local de pacientes.');
        }
    },

    /**
     * Obtiene un paciente por su ID
     * @param {string} id ID del paciente
     * @returns {Object|null} Objeto del paciente o null
     */
    getById(id) {
        try {
            const patients = this.getAll();
            return patients.find(p => p.id === id) || null;
        } catch (error) {
            console.error(`Error al buscar paciente con ID ${id}:`, error);
            throw new Error('Error al buscar el registro del paciente.');
        }
    },

    /**
     * Guarda la lista completa de pacientes en LocalStorage
     * @param {Array} patients Lista de pacientes a guardar
     */
    _saveAll(patients) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
        } catch (error) {
            console.error('Error al guardar pacientes en localStorage:', error);
            throw new Error('No hay suficiente espacio en disco o el almacenamiento local está deshabilitado.');
        }
    },

    /**
     * Crea y registra un nuevo paciente
     * @param {Object} patientData Datos del paciente
     * @returns {Object} El paciente creado
     */
    create(patientData) {
        try {
            this.validate(patientData);

            const patients = this.getAll();
            
            // Generar ID único incremental o basado en timestamp
            const newPatient = {
                id: `PAC-${Date.now()}`,
                name: patientData.name.trim(),
                age: parseInt(patientData.age, 10),
                gender: patientData.gender,
                phone: patientData.phone.trim(),
                email: patientData.email ? patientData.email.trim() : '',
                bloodType: patientData.bloodType,
                status: patientData.status || 'Estable',
                latitude: patientData.latitude ? parseFloat(patientData.latitude) : null,
                longitude: patientData.longitude ? parseFloat(patientData.longitude) : null,
                notes: patientData.notes ? patientData.notes.trim() : '',
                createdAt: new Date().toISOString()
            };

            patients.push(newPatient);
            this._saveAll(patients);
            return newPatient;
        } catch (error) {
            console.error('Error al crear paciente:', error);
            throw error; // Re-lanzar para que la interfaz muestre el mensaje de error específico
        }
    },

    /**
     * Actualiza un registro de paciente existente
     * @param {string} id ID del paciente a actualizar
     * @param {Object} updatedData Datos a modificar
     * @returns {Object} El paciente actualizado
     */
    update(id, updatedData) {
        try {
            this.validate(updatedData, true);

            const patients = this.getAll();
            const index = patients.findIndex(p => p.id === id);

            if (index === -1) {
                throw new Error('El paciente que intentas editar no existe en el sistema.');
            }

            const updatedPatient = {
                ...patients[index],
                name: updatedData.name.trim(),
                age: parseInt(updatedData.age, 10),
                gender: updatedData.gender,
                phone: updatedData.phone.trim(),
                email: updatedData.email ? updatedData.email.trim() : '',
                bloodType: updatedData.bloodType,
                status: updatedData.status,
                latitude: updatedData.latitude ? parseFloat(updatedData.latitude) : patients[index].latitude,
                longitude: updatedData.longitude ? parseFloat(updatedData.longitude) : patients[index].longitude,
                notes: updatedData.notes ? updatedData.notes.trim() : '',
                updatedAt: new Date().toISOString()
            };

            patients[index] = updatedPatient;
            this._saveAll(patients);
            return updatedPatient;
        } catch (error) {
            console.error(`Error al actualizar paciente con ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Elimina un paciente del registro
     * @param {string} id ID del paciente a eliminar
     * @returns {boolean} True si se eliminó con éxito
     */
    delete(id) {
        try {
            const patients = this.getAll();
            const filteredPatients = patients.filter(p => p.id !== id);

            if (patients.length === filteredPatients.length) {
                throw new Error('El registro del paciente no pudo ser encontrado.');
            }

            this._saveAll(filteredPatients);
            return true;
        } catch (error) {
            console.error(`Error al eliminar paciente con ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Valida los campos de datos de un paciente
     * @param {Object} data Datos a validar
     * @param {boolean} isUpdate Flag de edición
     */
    validate(data, isUpdate = false) {
        // Validación de Nombre
        if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 3) {
            throw new Error('El nombre debe tener al menos 3 caracteres.');
        }

        // Validación de Edad
        const ageNum = parseInt(data.age, 10);
        if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
            throw new Error('La edad ingresada debe ser un número válido entre 0 y 120 años.');
        }

        // Validación de Género
        const validGenders = ['Masculino', 'Femenino', 'Otro'];
        if (!data.gender || !validGenders.includes(data.gender)) {
            throw new Error('El género seleccionado no es válido.');
        }

        // Validación de Teléfono
        // Permite números locales, internacionales, guiones y espacios (mínimo 8 caracteres)
        const phoneRegex = /^\+?[0-9\s-]{8,15}$/;
        if (!data.phone || !phoneRegex.test(data.phone.trim())) {
            throw new Error('El teléfono debe tener un formato válido (entre 8 y 15 dígitos).');
        }

        // Validación de Email (opcional, pero si existe debe ser válido)
        if (data.email && data.email.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email.trim())) {
                throw new Error('El correo electrónico tiene un formato incorrecto.');
            }
        }

        // Validación de Grupo Sanguíneo
        const validBloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
        if (!data.bloodType || !validBloodTypes.includes(data.bloodType)) {
            throw new Error('El grupo sanguíneo seleccionado no es válido.');
        }

        // Validación de Estado de Salud
        const validStatuses = ['Estable', 'En Observación', 'Crítico', 'Alta'];
        if (!data.status || !validStatuses.includes(data.status)) {
            throw new Error('El estado de salud seleccionado no es válido.');
        }
    }
};
