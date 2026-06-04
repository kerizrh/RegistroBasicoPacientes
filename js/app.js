/**
 * SaludGest - Orquestador Principal (Fase 2)
 */
import { PatientService } from './patientService.js';

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar iconos Lucide
    if (window.lucide) {
        window.lucide.createIcons();
    }

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

    const loadPatients = () => {
        try {
            const patients = PatientService.getAll();
            
            if (patients.length === 0) {
                patientsTbody.innerHTML = '';
                patientsTable.classList.add('hidden');
                emptyState.classList.remove('hidden');
                return;
            }

            patientsTable.classList.remove('hidden');
            emptyState.classList.add('hidden');
            patientsTbody.innerHTML = '';

            patients.forEach(patient => {
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
                // Se implementará en el Commit 2.6
                showToast(`Cargando edición del paciente ${id}...`, 'info');
            });
        });

        // Botones de eliminar
        document.querySelectorAll('.btn-delete-patient').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                // Se implementará en el Commit 2.5
                showToast(`Iniciando eliminación del paciente ${id}...`, 'info');
            });
        });
    };

    // Exponer loadPatients globalmente para que sea accesible en otras fases
    window.loadPatients = loadPatients;

    // Inicializaciones básicas de la Fase 1 & 2
    initTheme();
    loadPatients();
    
    // Verificar si hay hash en la URL para navegar
    const currentHash = window.location.hash.replace('#', '');
    if (sections[currentHash]) {
        switchSection(currentHash);
    } else {
        switchSection('dashboard');
    }

    console.log('SaludGest inicializado correctamente - Fase 2 Renderizado Listo');
});

