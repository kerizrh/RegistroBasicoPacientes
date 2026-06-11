/**
 * SaludGest - Exportación de reportes
 */

export const ReportService = {

    exportPatientsToExcel(patients) {

        const data = patients.map(patient => ({
            ID: patient.id,
            Nombre: patient.name,
            Edad: patient.age,
            Género: patient.gender,
            Teléfono: patient.phone,
            Correo: patient.email,
            Grupo_Sanguíneo: patient.bloodType,
            Estado: patient.status,
            Latitud: patient.latitude,
            Longitud: patient.longitude,
            Observaciones: patient.notes,
            Fecha_Registro: patient.createdAt
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);

        worksheet["!cols"] = [
            { wch: 20 },
            { wch: 30 },
            { wch: 10 },
            { wch: 15 },
            { wch: 20 },
            { wch: 30 },
            { wch: 18 },
            { wch: 18 },
            { wch: 15 },
            { wch: 15 },
            { wch: 40 },
            { wch: 25 }
        ];

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Pacientes"
        );

        XLSX.writeFile(
            workbook,
            `Pacientes_${new Date().toISOString().split('T')[0]}.xlsx`
        );
    }
};