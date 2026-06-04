/**
 * SaludGest - Orquestador Principal (Fase 1)
 */

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

    // Inicializaciones básicas de la Fase 1
    initTheme();
    
    // Verificar si hay hash en la URL para navegar
    const currentHash = window.location.hash.replace('#', '');
    if (sections[currentHash]) {
        switchSection(currentHash);
    } else {
        switchSection('dashboard');
    }

    console.log('SaludGest inicializado correctamente - Fase 1 Shell Lista');
});
