/**
 * SaludGest - Web Worker para Procesamiento de Estadísticas en Segundo Plano
 */

self.addEventListener('message', (e) => {
    // Recibe el array de pacientes a procesar
    const patients = e.data || [];
    
    // Estructura de resultados estadísticos
    const stats = {
        total: patients.length,
        critical: 0,
        avgAge: 0,
        byStatus: {
            'Estable': 0,
            'En Observación': 0,
            'Crítico': 0,
            'Alta': 0
        },
        byAgeRange: {
            'Niños (0-12)': 0,
            'Adolescentes (13-19)': 0,
            'Adultos (20-59)': 0,
            'Adulto Mayor (60+)': 0
        },
        byBloodType: {}
    };

    if (patients.length === 0) {
        self.postMessage(stats);
        return;
    }

    let totalAge = 0;

    patients.forEach(patient => {
        // 1. Contador por estado de salud
        if (stats.byStatus.hasOwnProperty(patient.status)) {
            stats.byStatus[patient.status]++;
        }

        // 2. Contador de críticos
        if (patient.status === 'Crítico') {
            stats.critical++;
        }

        // 3. Edad y Rangos de Edad
        const age = parseInt(patient.age, 10);
        if (!isNaN(age)) {
            totalAge += age;
            
            if (age <= 12) {
                stats.byAgeRange['Niños (0-12)']++;
            } else if (age <= 19) {
                stats.byAgeRange['Adolescentes (13-19)']++;
            } else if (age <= 59) {
                stats.byAgeRange['Adultos (20-59)']++;
            } else {
                stats.byAgeRange['Adulto Mayor (60+)']++;
            }
        }

        // 4. Grupo sanguíneo
        if (patient.bloodType) {
            if (!stats.byBloodType[patient.bloodType]) {
                stats.byBloodType[patient.bloodType] = 0;
            }
            stats.byBloodType[patient.bloodType]++;
        }
    });

    // Calcular la edad promedio
    stats.avgAge = parseFloat((totalAge / patients.length).toFixed(1));

    // Retorna las métricas calculadas al hilo de ejecución principal (UI)
    self.postMessage(stats);
});
