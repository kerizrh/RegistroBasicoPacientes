/**
 * SaludGest - Orquestador Principal (Fase 3)
 */
import { PatientService } from './patientService.js';
import { GeolocationHelper } from './geolocationHelper.js';
import { DoctorsService } from './doctorsService.js';

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar iconos Lucide
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Inicializar Web Worker
    const statsWorker = new Worker('js/worker.js');

    // Elementos del DOM
    const sidebar = document.querySelector('.sidebar');
    const mobileToggle = document.getElementById('mobile-toggle');
    const themeToggle = document.getElementById('theme-toggle');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    // Enlaces de navegación del menú
    const menuItems = {
        dashboard: document.getElementById('menu-dashboard'),
        pacientes: document.getElementById('menu-pacientes'),
        medicos: document.getElementById('menu-medicos')
    };

    // Secciones correspondientes
    const sections = {
        dashboard: document.getElementById('section-dashboard'),
        pacientes: document.getElementById('section-pacientes'),
        medicos: document.getElementById('section-medicos')
    };

    // Títulos e subtítulos de cada sección para actualizar dinámicamente el Header
    const sectionMetadata = {
        dashboard: {
            title: 'Dashboard',
            subtitle: 'Estadísticas generales y panel de control de SaludGest'
        },
        pacientes: {
            title: 'Gestión de Pacientes',
            subtitle: 'Registro, búsqueda y administración clínica de pacientes'
        },
        medicos: {
            title: 'Personal de Guardia',
            subtitle: 'Directorio del personal médico activo en el centro de salud'
        }
    };

    /* -------------------------------------------------------------
       GESTOR DE TEMA (CLARO / OSCURO)
       ------------------------------------------------------------- */
    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const iconDark = themeToggle.querySelector('.icon-dark');
        const iconLight = themeToggle.querySelector('.icon-light');
        const btnText = themeToggle.querySelector('span');

        if (savedTheme === 'dark') {
            document.body.classList.add('dark');
            iconDark.classList.add('hidden');
            iconLight.classList.remove('hidden');
            btnText.textContent = 'Tema Claro';
        } else {
            document.body.classList.remove('dark');
            iconDark.classList.remove('hidden');
            iconLight.classList.add('hidden');
            btnText.textContent = 'Tema Oscuro';
        }
    };

    const toggleTheme = () => {
        const isDark = document.body.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');

        const iconDark = themeToggle.querySelector('.icon-dark');
        const iconLight = themeToggle.querySelector('.icon-light');
        const btnText = themeToggle.querySelector('span');

        if (isDark) {
            iconDark.classList.add('hidden');
            iconLight.classList.remove('hidden');
            btnText.textContent = 'Tema Claro';
            showToast('Modo oscuro activado', 'info');
        } else {
            iconDark.classList.remove('hidden');
            iconLight.classList.add('hidden');
            btnText.textContent = 'Tema Oscuro';
            showToast('Modo claro activado', 'info');
        }

        // Sincronizar colores de Chart.js con el tema
        if (statusChart) {
            const textColor = isDark ? '#e2e8f0' : '#1e293b';
            statusChart.options.plugins.legend.labels.color = textColor;
            statusChart.options.plugins.tooltip.backgroundColor = isDark ? '#1e293b' : '#ffffff';
            statusChart.options.plugins.tooltip.titleColor = isDark ? '#ffffff' : '#1e293b';
            statusChart.options.plugins.tooltip.bodyColor = isDark ? '#cbd5e1' : '#475569';
            statusChart.update();
        }
    };

    themeToggle.addEventListener('click', toggleTheme);

    /* -------------------------------------------------------------
       SISTEMA DE NAVEGACIÓN SPA
       ------------------------------------------------------------- */
    const switchSection = (targetId) => {
        // Ocultar todas las secciones y quitar clases active de los menús
        Object.keys(sections).forEach(key => {
            if (sections[key]) sections[key].classList.remove('active');
            if (menuItems[key]) menuItems[key].classList.remove('active');
        });

        // Activar la sección objetivo
        if (sections[targetId]) sections[targetId].classList.add('active');
        if (menuItems[targetId]) menuItems[targetId].classList.add('active');

        // Actualizar el header principal
        if (sectionMetadata[targetId]) {
            pageTitle.textContent = sectionMetadata[targetId].title;
            pageSubtitle.textContent = sectionMetadata[targetId].subtitle;
        }

        // Si estamos en móvil, colapsar sidebar tras hacer clic
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('active');
        }

        // Forzar recálculo de íconos Lucide para elementos nuevos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    };

    // Ligar eventos a la navegación
    Object.keys(menuItems).forEach(key => {
        if (menuItems[key]) {
            menuItems[key].addEventListener('click', (e) => {
                e.preventDefault();
                switchSection(key);
            });
        }
    });

    // Toggle de menú móvil
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Cerrar sidebar si se redimensiona fuera de móvil
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('active');
        }
    });

    /* -------------------------------------------------------------
       SISTEMA DE TOASTS (NOTIFICACIONES DINÁMICAS)
       ------------------------------------------------------------- */
    window.showToast = (message, type = 'success') => {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let iconName = 'check-circle';
        if (type === 'danger') iconName = 'x-circle';
        if (type === 'warning') iconName = 'alert-triangle';
        if (type === 'info') iconName = 'info';

        toast.innerHTML = `
            <i data-lucide="${iconName}"></i>
            <div class="toast-content">${message}</div>
        `;

        container.appendChild(toast);

        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Auto-eliminar después de 3.5 segundos con animación de salida
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3500);
    };

    /* -------------------------------------------------------------
       MODAL DE PACIENTES, VALIDACIONES EN VIVO Y CREACIÓN
       ------------------------------------------------------------- */
    const patientModal = document.getElementById('patient-modal');
    const patientForm = document.getElementById('patient-form');
    const btnAddPatient = document.getElementById('btn-add-patient');
    const btnCancelPatient = document.getElementById('btn-cancel-patient');
    const btnCloseModal = document.getElementById('modal-close-btn');

    // Elementos de formulario e inputs
    const pId = document.getElementById('patient-id');
    const pName = document.getElementById('p-name');
    const pAge = document.getElementById('p-age');
    const pGender = document.getElementById('p-gender');
    const pPhone = document.getElementById('p-phone');
    const pEmail = document.getElementById('p-email');
    const pBlood = document.getElementById('p-blood');
    const pStatus = document.getElementById('p-status');
    const pLat = document.getElementById('p-lat');
    const pLng = document.getElementById('p-lng');
    const pNotes = document.getElementById('p-notes');

    // Helpers para mostrar/limpiar errores visuales
    const showFieldError = (inputEl, errorElId, message) => {
        inputEl.classList.add('error');
        const errSpan = document.getElementById(errorElId);
        if (errSpan) errSpan.textContent = message;
    };

    const clearFieldError = (inputEl, errorElId) => {
        inputEl.classList.remove('error');
        const errSpan = document.getElementById(errorElId);
        if (errSpan) errSpan.textContent = '';
    };

    // Funciones de validación individual
    const validateName = () => {
        if (!pName.value.trim() || pName.value.trim().length < 3) {
            showFieldError(pName, 'err-p-name', 'El nombre debe tener al menos 3 caracteres.');
            return false;
        }
        clearFieldError(pName, 'err-p-name');
        return true;
    };

    const validateAge = () => {
        const ageNum = parseInt(pAge.value, 10);
        if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
            showFieldError(pAge, 'err-p-age', 'La edad debe ser un número válido entre 0 y 120.');
            return false;
        }
        clearFieldError(pAge, 'err-p-age');
        return true;
    };

    const validateGender = () => {
        if (!pGender.value) {
            showFieldError(pGender, 'err-p-gender', 'Selecciona el género del paciente.');
            return false;
        }
        clearFieldError(pGender, 'err-p-gender');
        return true;
    };

    const validatePhone = () => {
        const phoneRegex = /^\+?[0-9\s-]{8,15}$/;
        if (!pPhone.value.trim() || !phoneRegex.test(pPhone.value.trim())) {
            showFieldError(pPhone, 'err-p-phone', 'Teléfono debe tener entre 8 y 15 dígitos.');
            return false;
        }
        clearFieldError(pPhone, 'err-p-phone');
        return true;
    };

    const validateEmail = () => {
        if (pEmail.value.trim() === '') {
            clearFieldError(pEmail, 'err-p-email');
            return true;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(pEmail.value.trim())) {
            showFieldError(pEmail, 'err-p-email', 'Formato de correo incorrecto.');
            return false;
        }
        clearFieldError(pEmail, 'err-p-email');
        return true;
    };

    const validateBlood = () => {
        if (!pBlood.value) {
            showFieldError(pBlood, 'err-p-blood', 'Selecciona el tipo de sangre.');
            return false;
        }
        clearFieldError(pBlood, 'err-p-blood');
        return true;
    };

    // Listeners para validaciones en tiempo real
    pName.addEventListener('input', validateName);
    pAge.addEventListener('input', validateAge);
    pGender.addEventListener('change', validateGender);
    pPhone.addEventListener('input', validatePhone);
    pEmail.addEventListener('input', validateEmail);
    pBlood.addEventListener('change', validateBlood);

    // Abrir modal
    const openModal = () => {
        resetForm();
        document.getElementById('modal-title').textContent = 'Registrar Nuevo Paciente';
        patientModal.classList.add('active');
    };

    // Cerrar modal
    const closeModal = () => {
        patientModal.classList.remove('active');
        resetForm();
    };

    // Abrir modal en modo edición
    const openEditModal = (id) => {
        try {
            const patient = PatientService.getById(id);
            if (!patient) {
                showToast('No se encontró el registro del paciente.', 'danger');
                return;
            }
            resetForm();

            // Rellenar campos del formulario con los datos guardados
            pId.value = patient.id;
            pName.value = patient.name;
            pAge.value = patient.age;
            pGender.value = patient.gender;
            pPhone.value = patient.phone;
            pEmail.value = patient.email;
            pBlood.value = patient.bloodType;
            pStatus.value = patient.status;
            pLat.value = patient.latitude || '';
            pLng.value = patient.longitude || '';
            pNotes.value = patient.notes || '';

            document.getElementById('modal-title').textContent = 'Editar Datos de Paciente';
            patientModal.classList.add('active');
        } catch (error) {
            showToast('Error al cargar datos del paciente.', 'danger');
        }
    };


    const resetForm = () => {
        patientForm.reset();
        pId.value = '';

        // Limpiar estilos de error
        [pName, pAge, pGender, pPhone, pEmail, pBlood, pStatus].forEach(el => el.classList.remove('error'));

        // Limpiar textos de error
        ['err-p-name', 'err-p-age', 'err-p-gender', 'err-p-phone', 'err-p-email', 'err-p-blood', 'err-p-status'].forEach(id => {
            const span = document.getElementById(id);
            if (span) span.textContent = '';
        });
    };

    btnAddPatient.addEventListener('click', openModal);
    btnCancelPatient.addEventListener('click', closeModal);
    btnCloseModal.addEventListener('click', closeModal);

    // Botón para geolocalizar al registrar paciente
    const btnGetLocation = document.getElementById('btn-get-location');
    if (btnGetLocation) {
        btnGetLocation.addEventListener('click', async () => {
            btnGetLocation.disabled = true;
            const originalHTML = btnGetLocation.innerHTML;
            btnGetLocation.innerHTML = '<div class="spinner text-xs" style="width:12px;height:12px;border-width:2px;margin:0;"></div> Obteniendo...';
            
            try {
                const coords = await GeolocationHelper.getCurrentLocation();
                pLat.value = coords.latitude.toFixed(6);
                pLng.value = coords.longitude.toFixed(6);
                showToast('Ubicación de ingreso capturada con éxito.', 'success');
            } catch (error) {
                showToast(error.message || 'No se pudo obtener la ubicación.', 'warning');
            } finally {
                btnGetLocation.disabled = false;
                btnGetLocation.innerHTML = originalHTML;
                if (window.lucide) window.lucide.createIcons();
            }
        });
    }

    // Enviar formulario (Crear o Actualizar)
    patientForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Validar todos los campos
        const isNameValid = validateName();
        const isAgeValid = validateAge();
        const isGenderValid = validateGender();
        const isPhoneValid = validatePhone();
        const isEmailValid = validateEmail();
        const isBloodValid = validateBlood();

        if (!isNameValid || !isAgeValid || !isGenderValid || !isPhoneValid || !isEmailValid || !isBloodValid) {
            showToast('Por favor, corrige los campos en rojo.', 'warning');
            return;
        }

        const patientData = {
            name: pName.value,
            age: pAge.value,
            gender: pGender.value,
            phone: pPhone.value,
            email: pEmail.value,
            bloodType: pBlood.value,
            status: pStatus.value,
            latitude: pLat.value || null,
            longitude: pLng.value || null,
            notes: pNotes.value
        };

        try {
            if (pId.value) {
                // Modo Edición
                PatientService.update(pId.value, patientData);
                showToast('Datos del paciente actualizados con éxito.', 'success');
            } else {
                // Modo Creación
                PatientService.create(patientData);
                showToast('Paciente registrado con éxito en el sistema.', 'success');
            }
            closeModal();

            loadPatients();
        } catch (error) {
            showToast(error.message || 'Error al guardar el paciente.', 'danger');
        }
    });

    /* -------------------------------------------------------------
       RENDERIZADO DE LA TABLA DE PACIENTES
       ------------------------------------------------------------- */
    const patientsTable = document.getElementById('patients-table');
    const patientsTbody = document.getElementById('patients-list-tbody');
    const emptyState = document.getElementById('patients-empty-state');

    const escapeHtml = (str) => {
        if (!str) return '';
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
    };

    const patientSearch = document.getElementById('patient-search');
    const filterStatus = document.getElementById('filter-status');

    /* -------------------------------------------------------------
       INTEGRACIÓN DE WEB WORKER & CHART.JS PARA ESTADÍSTICAS
       ------------------------------------------------------------- */
    let statusChart = null;

    const updateStatistics = () => {
        try {
            const patients = PatientService.getAll();
            statsWorker.postMessage(patients);
        } catch (error) {
            console.error('Error al enviar datos al Web Worker:', error);
        }
    };

    const initOrUpdateChart = (stats) => {
        const ctx = document.getElementById('chart-status');
        if (!ctx) return;

        const isDark = document.body.classList.contains('dark');
        const textColor = isDark ? '#e2e8f0' : '#1e293b';
        
        const labels = Object.keys(stats.byStatus);
        const dataValues = Object.values(stats.byStatus);

        if (statusChart) {
            // Actualizar datos del gráfico existente
            statusChart.data.datasets[0].data = dataValues;
            statusChart.options.plugins.legend.labels.color = textColor;
            statusChart.options.plugins.tooltip.backgroundColor = isDark ? '#1e293b' : '#ffffff';
            statusChart.options.plugins.tooltip.titleColor = isDark ? '#ffffff' : '#1e293b';
            statusChart.options.plugins.tooltip.bodyColor = isDark ? '#cbd5e1' : '#475569';
            statusChart.update();
        } else {
            // Crear instancia nueva de Chart.js
            statusChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: dataValues,
                        backgroundColor: [
                            'rgba(16, 185, 129, 0.75)',  // Estable - Verde
                            'rgba(245, 158, 11, 0.75)',  // En Observación - Naranja
                            'rgba(239, 68, 68, 0.75)',   // Crítico - Rojo
                            'rgba(14, 165, 233, 0.75)'   // Alta - Azul
                        ],
                        borderColor: [
                            'rgb(16, 185, 129)',
                            'rgb(245, 158, 11)',
                            'rgb(239, 68, 68)',
                            'rgb(14, 165, 233)'
                        ],
                        borderWidth: 2,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: textColor,
                                font: {
                                    family: 'Inter',
                                    size: 12,
                                    weight: '500'
                                },
                                padding: 15
                            }
                        },
                        tooltip: {
                            backgroundColor: isDark ? '#1e293b' : '#ffffff',
                            titleColor: isDark ? '#ffffff' : '#1e293b',
                            bodyColor: isDark ? '#cbd5e1' : '#475569',
                            borderColor: 'rgba(0,0,0,0.08)',
                            borderWidth: 1,
                            padding: 10,
                            boxPadding: 6
                        }
                    },
                    cutout: '72%'
                }
            });
        }
    };

    statsWorker.onmessage = (e) => {
        const stats = e.data;
        
        // Actualizar métricas del Dashboard en el DOM
        const totalEl = document.getElementById('metric-total-patients');
        const criticalEl = document.getElementById('metric-critical-patients');
        const avgAgeEl = document.getElementById('metric-avg-age');
        const criticalDescEl = document.getElementById('metric-critical-desc');

        if (totalEl) totalEl.textContent = stats.total;
        if (criticalEl) criticalEl.textContent = stats.critical;
        if (avgAgeEl) avgAgeEl.textContent = stats.avgAge.toFixed(1);

        if (criticalDescEl) {
            if (stats.critical === 0) {
                criticalDescEl.textContent = 'Ningún caso crítico registrado';
                criticalDescEl.className = 'metric-footer text-success';
            } else {
                criticalDescEl.textContent = 'Requieren atención inmediata';
                criticalDescEl.className = 'metric-footer text-danger';
            }
        }

        // Inicializar o actualizar gráfico de distribución por estado
        initOrUpdateChart(stats);

        // Guardar estadísticas para uso global
        window.dashboardStats = stats;
        
        // Disparar evento por si otros componentes necesitan enterarse
        const event = new CustomEvent('statsUpdated', { detail: stats });
        window.dispatchEvent(event);
    };

    const loadPatients = () => {
        try {
            const patients = PatientService.getAll();
            
            // Disparar recálculo de estadísticas en segundo plano
            updateStatistics();
            
            // Obtener criterios de búsqueda y filtros activos
            const searchTerm = patientSearch ? patientSearch.value.trim().toLowerCase() : '';
            const statusFilter = filterStatus ? filterStatus.value : 'todos';

            // Filtrar la lista
            let filteredPatients = patients;
            if (searchTerm) {
                filteredPatients = filteredPatients.filter(p => 
                    p.name.toLowerCase().includes(searchTerm) || 
                    p.id.toLowerCase().includes(searchTerm)
                );
            }
            if (statusFilter !== 'todos') {
                filteredPatients = filteredPatients.filter(p => p.status === statusFilter);
            }

            if (filteredPatients.length === 0) {
                patientsTbody.innerHTML = '';
                patientsTable.classList.add('hidden');
                emptyState.classList.remove('hidden');

                // Actualizar textos de empty state dinámicamente
                const titleEl = emptyState.querySelector('h3');
                const descEl = emptyState.querySelector('p');
                if (patients.length === 0) {
                    if (titleEl) titleEl.textContent = 'No hay pacientes registrados';
                    if (descEl) descEl.textContent = 'Comienza registrando un nuevo paciente haciendo clic en el botón superior.';
                } else {
                    if (titleEl) titleEl.textContent = 'Sin resultados de búsqueda';
                    if (descEl) descEl.textContent = 'Intenta cambiar los términos de búsqueda o los filtros seleccionados.';
                }
                return;
            }

            patientsTable.classList.remove('hidden');
            emptyState.classList.add('hidden');
            patientsTbody.innerHTML = '';

            filteredPatients.forEach(patient => {
                const tr = document.createElement('tr');
                
                let badgeClass = 'badge-stable';
                if (patient.status === 'En Observación') badgeClass = 'badge-obs';
                if (patient.status === 'Crítico') badgeClass = 'badge-critical';
                if (patient.status === 'Alta') badgeClass = 'badge-released';

                const locationText = (patient.latitude && patient.longitude)
                    ? `${parseFloat(patient.latitude).toFixed(4)}, ${parseFloat(patient.longitude).toFixed(4)}`
                    : 'No registrada';

                tr.innerHTML = `
                    <td>
                        <div class="patient-info-cell">
                            <span class="patient-name-text">${escapeHtml(patient.name)}</span>
                            <span class="patient-id-text">${patient.id}</span>
                        </div>
                    </td>
                    <td>${patient.age} años / ${patient.gender}</td>
                    <td>
                        <div class="flex flex-col">
                            <span>${escapeHtml(patient.phone)}</span>
                            <span class="text-xs text-muted">${escapeHtml(patient.email) || 'Sin correo'}</span>
                        </div>
                    </td>
                    <td><span class="badge bg-light-primary text-primary">${patient.bloodType}</span></td>
                    <td><span class="badge ${badgeClass}">${patient.status}</span></td>
                    <td>
                        <span class="text-sm flex items-center gap-1">
                            <i data-lucide="map-pin" class="text-muted" style="width: 14px; height: 14px;"></i>
                            <span>${locationText}</span>
                        </span>
                    </td>
                    <td class="text-right">
                        <div class="action-cell">
                            <button class="btn-icon btn-edit-patient" data-id="${patient.id}" title="Editar">
                                <i data-lucide="edit-3"></i>
                            </button>
                            <button class="btn-icon btn-icon-danger btn-delete-patient" data-id="${patient.id}" title="Eliminar">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    </td>
                `;
                patientsTbody.appendChild(tr);
            });

            if (window.lucide) {
                window.lucide.createIcons();
            }

            // Exponer las acciones de edición y eliminación
            bindListActions();
        } catch (error) {
            showToast('Error al cargar la lista de pacientes.', 'danger');
        }
    };

    const bindListActions = () => {
        // Botones de editar
        document.querySelectorAll('.btn-edit-patient').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                openEditModal(id);
            });
        });

        // Botones de eliminar
        document.querySelectorAll('.btn-delete-patient').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                openDeleteModal(id);
            });
        });
    };

    /* -------------------------------------------------------------
       MODAL DE CONFIRMACIÓN DE ELIMINACIÓN
       ------------------------------------------------------------- */
    const deleteModal = document.getElementById('delete-modal');
    const deletePatientNameSpan = document.getElementById('delete-patient-name');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    let patientIdToDelete = null;

    const openDeleteModal = (id) => {
        try {
            const patient = PatientService.getById(id);
            if (!patient) {
                showToast('No se encontró el registro del paciente.', 'danger');
                return;
            }
            patientIdToDelete = id;
            deletePatientNameSpan.textContent = patient.name;
            deleteModal.classList.add('active');
        } catch (error) {
            showToast('Error al intentar abrir el diálogo de confirmación.', 'danger');
        }
    };

    const closeDeleteModal = () => {
        deleteModal.classList.remove('active');
        patientIdToDelete = null;
    };

    btnCancelDelete.addEventListener('click', closeDeleteModal);

    btnConfirmDelete.addEventListener('click', () => {
        if (!patientIdToDelete) return;
        try {
            PatientService.delete(patientIdToDelete);
            showToast('Paciente eliminado permanentemente.', 'success');
            closeDeleteModal();
            loadPatients();
        } catch (error) {
            showToast(error.message || 'Error al intentar eliminar el registro.', 'danger');
            closeDeleteModal();
        }
    });

    // Exponer loadPatients globalmente para que sea accesible en otras fases
    window.loadPatients = loadPatients;


    // Restaurar filtros de sessionStorage al cargar
    if (patientSearch && filterStatus) {
        patientSearch.value = sessionStorage.getItem('saludgest_search') || '';
        filterStatus.value = sessionStorage.getItem('saludgest_status') || 'todos';

        // Escuchar cambios para actualizar sessionStorage y recargar tabla
        patientSearch.addEventListener('input', () => {
            sessionStorage.setItem('saludgest_search', patientSearch.value);
            loadPatients();
        });

        filterStatus.addEventListener('change', () => {
            sessionStorage.setItem('saludgest_status', filterStatus.value);
            loadPatients();
        });
    }

    const loadDashboardLocation = async () => {
        const metricLocation = document.getElementById('metric-location');
        if (!metricLocation) return;
        
        try {
            metricLocation.textContent = 'Obteniendo...';
            const coords = await GeolocationHelper.getCurrentLocation();
            metricLocation.textContent = `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
        } catch (error) {
            metricLocation.textContent = 'No disponible';
            console.log('Geolocalización en Dashboard no autorizada:', error.message);
        }
    };

        /* -------------------------------------------------------------
           DIRECTORIO DE PERSONAL MÉDICO (API REST FETCH)
           ------------------------------------------------------------- */
        const doctorsGrid = document.getElementById('doctors-list-grid');
        const btnRefreshDoctors = document.getElementById('btn-refresh-doctors');
        const dashboardDoctorsList = document.getElementById('dashboard-doctors-list');
        const staffCountBadge = document.getElementById('staff-count');

        const loadDoctorsDirectory = async () => {
            // Mostrar estados de carga en directorio y dashboard widget
            if (doctorsGrid) {
                doctorsGrid.innerHTML = `
                    <div class="loading-state card">
                        <div class="spinner"></div>
                        <p>Cargando médicos de guardia desde la API...</p>
                    </div>
                `;
            }
            if (dashboardDoctorsList) {
                dashboardDoctorsList.innerHTML = `
                    <div class="loading-state py-4">
                        <div class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>
                        <p class="text-xs text-muted">Obteniendo médicos...</p>
                    </div>
                `;
            }
            if (staffCountBadge) {
                staffCountBadge.textContent = '...';
            }

            try {
                const doctors = await DoctorsService.getDoctorsOnDuty();
                
                // Renderizar en directorio médico si la grilla está en pantalla
                if (doctorsGrid) {
                    doctorsGrid.innerHTML = '';
                    doctors.forEach(doc => {
                        const card = document.createElement('div');
                        card.className = 'doctor-card card';
                        const badgeClass = doc.status === 'Disponible' ? 'badge-stable' : 'badge-obs';

                        card.innerHTML = `
                            <img src="${doc.avatar}" alt="${escapeHtml(doc.name)}" class="doctor-card-avatar">
                            <h4 class="doctor-card-name">${escapeHtml(doc.name)}</h4>
                            <span class="doctor-card-specialty">${escapeHtml(doc.specialty)}</span>
                            <span class="badge ${badgeClass} mb-4">${doc.status}</span>
                            <div class="doctor-card-info">
                                <div class="doctor-card-info-item">
                                    <i data-lucide="phone"></i>
                                    <span>${escapeHtml(doc.phone)}</span>
                                </div>
                                <div class="doctor-card-info-item">
                                    <i data-lucide="mail"></i>
                                    <span>${escapeHtml(doc.email)}</span>
                                </div>
                                <div class="doctor-card-info-item">
                                    <i data-lucide="map-pin"></i>
                                    <span>Sede: ${escapeHtml(doc.city)}</span>
                                </div>
                            </div>
                        `;
                        doctorsGrid.appendChild(card);
                    });
                }

                // Renderizar vista previa en el widget del Dashboard (primeros 4 médicos)
                if (dashboardDoctorsList) {
                    dashboardDoctorsList.innerHTML = '';
                    const previewDoctors = doctors.slice(0, 4);
                    
                    previewDoctors.forEach(doc => {
                        const item = document.createElement('div');
                        item.className = 'doctor-item';
                        const badgeClass = doc.status === 'Disponible' ? 'badge-stable' : 'badge-obs';
                        
                        item.innerHTML = `
                            <img src="${doc.avatar}" alt="${escapeHtml(doc.name)}" class="doctor-avatar">
                            <div class="doctor-details">
                                <span class="doctor-name">${escapeHtml(doc.name)}</span>
                                <span class="doctor-specialty">${escapeHtml(doc.specialty)}</span>
                            </div>
                            <span class="doctor-tag ${badgeClass}">${doc.status}</span>
                        `;
                        dashboardDoctorsList.appendChild(item);
                    });
                }

                if (staffCountBadge) {
                    staffCountBadge.textContent = `${doctors.length} Activos`;
                }

                if (window.lucide) {
                    window.lucide.createIcons();
                }

                window.doctorsData = doctors;
            } catch (error) {
                console.error(error);
                
                if (doctorsGrid) {
                    doctorsGrid.innerHTML = `
                        <div class="card col-span-2 text-center py-8">
                            <div class="text-danger mb-4">
                                <i data-lucide="alert-circle" style="width: 48px; height: 48px; margin: auto;"></i>
                            </div>
                            <h3>Error al obtener directorio</h3>
                            <p class="text-muted mb-4">${error.message || 'Error de conexión.'}</p>
                            <button class="btn btn-primary" id="btn-retry-doctors">
                                <i data-lucide="rotate-cw"></i> Reintentar
                            </button>
                        </div>
                    `;
                    const btnRetry = document.getElementById('btn-retry-doctors');
                    if (btnRetry) btnRetry.addEventListener('click', loadDoctorsDirectory);
                }

                if (dashboardDoctorsList) {
                    dashboardDoctorsList.innerHTML = `
                        <p class="text-danger text-center text-xs py-4">
                            Error al sincronizar médicos de guardia.
                        </p>
                    `;
                }
                if (staffCountBadge) {
                    staffCountBadge.textContent = 'Error';
                }

                if (window.lucide) window.lucide.createIcons();
            }
        };

        if (btnRefreshDoctors) {
            btnRefreshDoctors.addEventListener('click', loadDoctorsDirectory);
        }

        // Inicializaciones básicas de la Fase 1, 2 & 3
        initTheme();
        loadPatients();
        loadDashboardLocation();
        loadDoctorsDirectory();
        
        // Verificar si hay hash en la URL para navegar
        const currentHash = window.location.hash.replace('#', '');
        if (sections[currentHash]) {
            switchSection(currentHash);
        } else {
            switchSection('dashboard');
        }

        console.log('SaludGest inicializado correctamente - Fase 3 Directorio Médico Listo');
    });

