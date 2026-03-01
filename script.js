/**
 * HUI General Hospital - Core SPA Engine
 * Architecture:
 * 1. State Management & LocalStorage Sync
 * 2. Hash-based Router
 * 3. Simulated API (Promises)
 * 4. UI Hydration & Template Cloning
 * 5. Interactive Components (Modals, Toasts, Observers)
 * 6. Form Handling & Validation
 */

const app = (function () {
    const VALID_INPUT_TYPES = new Set(['text', 'number', 'tel', 'date', 'email']);

    function escapeHTML(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function sanitizeFieldKey(value) {
        return String(value ?? '').replace(/[^a-zA-Z0-9_-]/g, '');
    }

    function safeInt(value, fallback = 0) {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function readStoredTheme() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        try {
            const storedTheme = localStorage.getItem('hui-theme');
            if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme;
        } catch (_error) {
            // Ignore storage access errors and fallback to system preference.
        }
        return prefersDark;
    }

    function persistTheme(theme) {
        try {
            localStorage.setItem('hui-theme', theme);
        } catch (_error) {
            // Ignore storage access errors.
        }
    }

    function clearLegacyBookingStorage() {
        try {
            localStorage.removeItem('hui-bookings');
        } catch (_error) {
            // Ignore storage access errors.
        }
    }

    function joinNonEmpty(parts, separator = ', ') {
        return parts.filter(Boolean).join(separator);
    }

    function setThemeMetaColor(theme) {
        const meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) return;
        meta.setAttribute('content', theme === 'dark' ? '#0f172a' : '#0066cc');
    }

    function syncThemeToggleButtons(theme) {
        const isDark = theme === 'dark';
        ['theme-toggle', 'mobile-theme-toggle'].forEach((id) => {
            const button = document.getElementById(id);
            if (!button) return;
            button.setAttribute('aria-pressed', isDark ? 'true' : 'false');
            button.setAttribute('aria-label', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
        });
    }

    function applyTheme(theme, { persist = false } = {}) {
        const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
        state.theme = normalizedTheme;
        document.documentElement.classList.toggle('dark', normalizedTheme === 'dark');
        document.documentElement.classList.toggle('light', normalizedTheme === 'light');
        document.documentElement.setAttribute('data-theme', normalizedTheme);
        document.documentElement.style.colorScheme = normalizedTheme;
        setThemeMetaColor(normalizedTheme);
        syncThemeToggleButtons(normalizedTheme);
        if (persist) saveState();
    }

    // ==========================================================================
    // 1. STATE MANAGEMENT
    // ==========================================================================
    const state = {
        theme: readStoredTheme(),
        currentRoute: '',
        data: null, // Will hold the injected data from data.js
        isNavigating: false
    };
    const appointmentContext = {
        source: 'universal',
        selectedDoctorId: '',
        lockDepartment: false
    };
    const appointmentDepartmentCache = new Map();
    const SEO_DEFAULT = {
        siteName: 'HUI General Hospital',
        title: "Best Multi Speciality & Children's Hospital in Hyderabad | HUI General Hospital",
        description: 'HUI General Hospital is a multi speciality hospital in Hyderabad with child specialist doctors, pediatrics and neonatology, NICU/PICU support, pediatric emergency care, and online appointments.',
        ogImage: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1600'
    };
    const SEO_BY_ROUTE = {
        home: {
            title: "Best Multi Speciality & Children's Hospital in Hyderabad | HUI General Hospital",
            description: 'Book doctor appointments online at HUI General Hospital, Hyderabad with child specialist care, pediatric support, and emergency services.'
        },
        departments: {
            title: 'Hospital Departments in Hyderabad | Pediatrics, NICU & Multi-Speciality Care | HUI General Hospital',
            description: 'Explore hospital departments in Hyderabad including pediatrics and neonatology, NICU/PICU support, cardiology, neurology, orthopedics, oncology, radiology, and emergency care.'
        },
        doctors: {
            title: 'Specialist & Child Specialist Doctors in Hyderabad | HUI General Hospital',
            description: 'Find specialist and child specialist doctors in Hyderabad including pediatricians, neonatologists, emergency physicians, and other consultants with online booking.'
        },
        facilities: {
            title: 'Hospital Facilities in Hyderabad | HUI General Hospital',
            description: 'Review ICU beds, diagnostics, operation theaters, and critical care infrastructure at HUI Hospital Hyderabad.'
        }
    };

    function saveState() {
        persistTheme(state.theme);
    }

    function upsertMeta(attributeName, key, content) {
        const selector = `meta[${attributeName}="${key}"]`;
        let node = document.head.querySelector(selector);
        if (!node) {
            node = document.createElement('meta');
            node.setAttribute(attributeName, key);
            document.head.appendChild(node);
        }
        node.setAttribute('content', String(content || ''));
    }

    function getBaseCanonicalUrl() {
        const origin = String(window.location.origin || '').replace(/\/$/, '');
        const path = String(window.location.pathname || '/');
        return `${origin}${path}`;
    }

    function buildAbsolutePageUrl(relativePath = '') {
        const normalizedRelativePath = String(relativePath || '').replace(/^\.?\//, '');
        const baseUrl = getBaseCanonicalUrl();
        const baseWithSlash = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        return normalizedRelativePath ? `${baseWithSlash}${normalizedRelativePath}` : baseWithSlash;
    }

    function getRoutePageUrl(route = 'home') {
        const normalizedRoute = String(route || 'home').toLowerCase();
        const routePageMap = {
            home: '',
            departments: 'departments.html',
            doctors: 'doctors.html',
            facilities: 'facilities.html'
        };
        const routePage = routePageMap[normalizedRoute];
        if (routePage === undefined) return `${getBaseCanonicalUrl()}#${normalizedRoute}`;
        return buildAbsolutePageUrl(routePage);
    }

    function updateRouteSeo(route = 'home') {
        const normalizedRoute = String(route || 'home').toLowerCase();
        const routeSeo = SEO_BY_ROUTE[normalizedRoute] || SEO_DEFAULT;
        const baseUrl = getBaseCanonicalUrl();
        const routeUrl = getRoutePageUrl(normalizedRoute);
        const title = String(routeSeo.title || SEO_DEFAULT.title);
        const description = String(routeSeo.description || SEO_DEFAULT.description);

        document.title = title;
        upsertMeta('name', 'description', description);
        upsertMeta('property', 'og:title', title);
        upsertMeta('property', 'og:description', description);
        upsertMeta('property', 'og:url', routeUrl);
        upsertMeta('property', 'og:image', SEO_DEFAULT.ogImage);
        upsertMeta('name', 'twitter:title', title);
        upsertMeta('name', 'twitter:description', description);
        upsertMeta('name', 'twitter:image', SEO_DEFAULT.ogImage);

        const canonicalLink = document.getElementById('canonical-link');
        if (canonicalLink) canonicalLink.setAttribute('href', baseUrl);
    }

    function injectStructuredData() {
        const d = state.data;
        if (!d) return;

        const baseUrl = getBaseCanonicalUrl();
        const meta = d.meta || {};
        const contact = d.contact || {};
        const address = (Array.isArray(d.addresses) && d.addresses[0]) ? d.addresses[0] : {};
        const departments = Array.isArray(d.departments) ? d.departments : [];
        const doctors = Array.isArray(d.doctors) ? d.doctors : [];

        const hospitalNode = {
            '@type': 'Hospital',
            '@id': `${baseUrl}#hospital`,
            name: String(meta.name || SEO_DEFAULT.siteName),
            url: baseUrl,
            telephone: String(contact.mainPhone || ''),
            email: String(contact.emailGeneral || ''),
            image: SEO_DEFAULT.ogImage,
            address: {
                '@type': 'PostalAddress',
                streetAddress: String(address.line1 || ''),
                addressLocality: String(address.city || ''),
                addressRegion: String(address.state || ''),
                postalCode: String(address.pincode || ''),
                addressCountry: String(address.country || 'IN')
            },
            areaServed: [String(address.city || 'Hyderabad'), String(address.state || 'Telangana')],
            openingHours: 'Mo-Su 00:00-23:59',
            geo: {
                '@type': 'GeoCoordinates',
                latitude: 17.385,
                longitude: 78.4867
            },
            department: departments.map((department) => ({
                '@type': 'MedicalClinic',
                name: String(department.name || ''),
                description: String(department.description || ''),
                url: buildAbsolutePageUrl(getDepartmentSeoPagePath(department))
            })).filter((department) => department.name)
        };

        const websiteNode = {
            '@type': 'WebSite',
            '@id': `${baseUrl}#website`,
            name: String(meta.name || SEO_DEFAULT.siteName),
            url: baseUrl,
            potentialAction: {
                '@type': 'SearchAction',
                target: buildAbsolutePageUrl('doctors.html'),
                'query-input': 'required name=doctor'
            }
        };
        const serviceNode = {
            '@type': 'MedicalBusiness',
            '@id': `${baseUrl}#services`,
            name: String(meta.name || SEO_DEFAULT.siteName),
            areaServed: ['Hyderabad', 'Telangana'],
            medicalSpecialty: departments.map((department) => String(department.name || '')).filter(Boolean)
        };

        const doctorListNode = {
            '@type': 'ItemList',
            '@id': `${baseUrl}#doctor-list`,
            name: 'Specialist Doctors',
            itemListElement: doctors.map((doctor, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                    '@type': 'Physician',
                    name: String(doctor.name || ''),
                    medicalSpecialty: String(doctor.specialization || ''),
                    worksFor: { '@id': `${baseUrl}#hospital` }
                }
            })).filter((entry) => entry.item.name)
        };
        const faqNode = {
            '@type': 'FAQPage',
            '@id': `${baseUrl}#faq`,
            mainEntity: [
                {
                    '@type': 'Question',
                    name: 'How can I book an appointment at HUI General Hospital?',
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Use the Book Appointment button, choose department and doctor, then submit your details for SMS confirmation.'
                    }
                },
                {
                    '@type': 'Question',
                    name: 'Is emergency care available 24x7?',
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Yes. Emergency and trauma services are available 24x7 with access to diagnostics and critical care.'
                    }
                },
                {
                    '@type': 'Question',
                    name: 'Can I choose doctor and department in one booking flow?',
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Yes. Selecting a doctor maps the department, and selecting a department filters available doctors.'
                    }
                }
            ]
        };

        const schemaPayload = {
            '@context': 'https://schema.org',
            '@graph': [hospitalNode, websiteNode, serviceNode, doctorListNode, faqNode]
        };

        let schemaNode = document.getElementById('seo-structured-data');
        if (!schemaNode) {
            schemaNode = document.createElement('script');
            schemaNode.type = 'application/ld+json';
            schemaNode.id = 'seo-structured-data';
            document.head.appendChild(schemaNode);
        }
        schemaNode.textContent = JSON.stringify(schemaPayload);
    }

    // ==========================================================================
    // 2. SIMULATED API CALLS
    // ==========================================================================
    const api = {
        fetchData: () => new Promise((resolve, reject) => {
            // Simulate network latency (400ms)
            setTimeout(() => {
                if (window.HUIData) {
                    state.data = window.HUIData.hospital_overview_full_detailed;
                    appointmentDepartmentCache.clear();
                    if (state.data) {
                        resolve(state.data);
                        return;
                    }
                } else {
                    console.error("Data missing. Ensure data.js is loaded.");
                }
                reject(new Error('Application data is unavailable.'));
            }, 400);
        }),
        submitBooking: (bookingData) => new Promise((resolve, reject) => {
            setTimeout(() => {
                if (!bookingData || typeof bookingData !== 'object') {
                    return reject(new Error("Invalid booking payload."));
                }

                const bookingId = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
                    ? crypto.randomUUID()
                    : `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

                const newBooking = {
                    id: bookingId,
                    ...bookingData,
                    status: 'pending',
                    bookedAt: new Date().toISOString()
                };
                resolve(newBooking);
            }, 800);
        })
    };

    // ==========================================================================
    // 3. UI UTILITIES & ANIMATIONS
    // ==========================================================================
    const ui = {
        showToast(type, title, message) {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            const icons = { success: 'fa-check-circle', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
            const safeType = Object.prototype.hasOwnProperty.call(icons, type) ? type : 'info';

            toast.className = `toast toast-${safeType}`;

            const iconWrap = document.createElement('div');
            iconWrap.className = 'toast-icon';
            const icon = document.createElement('i');
            icon.className = `fa-solid ${icons[safeType]}`;
            iconWrap.appendChild(icon);

            const content = document.createElement('div');
            content.className = 'toast-content';
            const titleNode = document.createElement('div');
            titleNode.className = 'toast-title';
            titleNode.textContent = String(title ?? '');
            const messageNode = document.createElement('div');
            messageNode.className = 'toast-message';
            messageNode.textContent = String(message ?? '');
            content.appendChild(titleNode);
            content.appendChild(messageNode);

            const closeBtn = document.createElement('button');
            closeBtn.className = 'toast-close';
            closeBtn.setAttribute('aria-label', 'Close');
            const closeIcon = document.createElement('i');
            closeIcon.className = 'fa-solid fa-xmark';
            closeBtn.appendChild(closeIcon);

            toast.appendChild(iconWrap);
            toast.appendChild(content);
            toast.appendChild(closeBtn);

            container.appendChild(toast);

            const dismiss = () => {
                toast.classList.add('hiding');
                setTimeout(() => toast.remove(), 300);
            };

            closeBtn.addEventListener('click', dismiss);
            setTimeout(dismiss, 5000); // Auto dismiss after 5s
        },

        toggleTheme() {
            const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
            applyTheme(nextTheme, { persist: true });
        },

        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => { clearTimeout(timeout); func(...args); };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        initObservers() {
            // Counters Observer
            const counters = document.querySelectorAll('.stat-value');
            const counterObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const target = entry.target;
                        const finalValue = parseInt(target.getAttribute('data-target'), 10);
                        ui.animateCountUp(target, finalValue, 1500);
                        observer.unobserve(target); // Run once
                    }
                });
            }, { threshold: 0.5 });
            counters.forEach(c => counterObserver.observe(c));

            // Fade In Elements Observer
            const fadeElements = document.querySelectorAll('.fade-in-section');
            const fadeObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-fade-in-up');
                        fadeObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            fadeElements.forEach(el => fadeObserver.observe(el));
        },

        animateCountUp(element, target, duration) {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                element.innerText = target.toLocaleString();
                return;
            }
            let start = 0;
            const increment = target / (duration / 16); // 60fps
            const updateCounter = () => {
                start += increment;
                if (start < target) {
                    element.innerText = Math.ceil(start).toLocaleString();
                    requestAnimationFrame(updateCounter);
                } else {
                    element.innerText = target.toLocaleString();
                }
            };
            updateCounter();
        },

        updateScrollProgress() {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            const indicator = document.getElementById('scroll-progress');
            if(indicator) indicator.style.width = scrolled + "%";
        }
    };

    // ==========================================================================
    // 4. MODAL & FOCUS TRAP
    // ==========================================================================
    const modals = {
        activeModal: null,
        open(id) {
            const modal = document.getElementById(id);
            if (!modal) return;
            modal.classList.remove('hidden');
            // Trigger reflow for transition
            void modal.offsetWidth; 
            modal.classList.remove('opacity-0');
            modal.querySelector('.modal-content').classList.remove('scale-95');
            document.body.style.overflow = 'hidden'; // Prevent background scroll
            this.activeModal = modal;
            
            // Populate and sync appointment fields when opening appointment modal.
            if(id === 'appointment-modal') {
                populateAppointmentForm();
                applyAppointmentContext();
            }
            
            // Focus trap setup
            const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusable.length) focusable[0].focus();
        },
        close(id) {
            const modal = document.getElementById(id);
            if (!modal) return;
            modal.classList.add('opacity-0');
            modal.querySelector('.modal-content').classList.add('scale-95');
            setTimeout(() => {
                modal.classList.add('hidden');
                document.body.style.overflow = '';
                this.activeModal = null;
            }, 300);
        }
    };

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modals.activeModal) {
            modals.close(modals.activeModal.id);
        }
    });

    function setAppointmentContext({ source = 'universal', selectedDoctorId = '', lockDepartment = false } = {}) {
        const normalizedDoctorId = String(selectedDoctorId || '').trim();
        appointmentContext.source = String(source || 'universal');
        appointmentContext.selectedDoctorId = normalizedDoctorId;
        appointmentContext.lockDepartment = Boolean(lockDepartment && normalizedDoctorId);
    }

    function openAppointmentForDoctor(doctorId = '') {
        const normalizedDoctorId = String(doctorId || '').trim();
        setAppointmentContext({
            source: normalizedDoctorId ? 'doctor-card' : 'universal',
            selectedDoctorId: normalizedDoctorId,
            lockDepartment: Boolean(normalizedDoctorId)
        });
        modals.open('appointment-modal');
    }

    function bindDoctorSearch(scope = document) {
        const searchInput = scope.querySelector('#doc-search');
        const doctorsGrid = scope.querySelector('#doctors-grid');
        if (!searchInput || !doctorsGrid) return;
        if (searchInput.dataset.boundSearch === '1') return;
        searchInput.dataset.boundSearch = '1';

        const applyFilter = () => {
            const term = String(searchInput.value || '').trim().toLowerCase();
            doctorsGrid.querySelectorAll('.doctor-card').forEach((card) => {
                const haystack = String(card.getAttribute('data-search') || '');
                card.style.display = (!term || haystack.includes(term)) ? '' : 'none';
            });
        };

        const searchBtn = scope.querySelector('#doc-search-btn');
        const debouncedFilter = ui.debounce(applyFilter, 120);
        searchInput.addEventListener('input', debouncedFilter);
        if (searchBtn) searchBtn.addEventListener('click', applyFilter);
        applyFilter();
    }

    function bindActionHandlers(scope = document) {
        scope.querySelectorAll('.js-open-appointment').forEach((button) => {
            if (button.dataset.boundOpen === '1') return;
            button.dataset.boundOpen = '1';
            button.addEventListener('click', () => {
                setAppointmentContext({ source: 'universal', selectedDoctorId: '', lockDepartment: false });
                modals.open('appointment-modal');
            });
        });

        scope.querySelectorAll('.js-close-modal').forEach((button) => {
            if (button.dataset.boundClose === '1') return;
            button.dataset.boundClose = '1';
            button.addEventListener('click', () => {
                const modalId = button.getAttribute('data-modal-id');
                if (modalId) modals.close(modalId);
            });
        });

        scope.querySelectorAll('.book-btn').forEach((button) => {
            if (button.dataset.boundBook === '1') return;
            button.dataset.boundBook = '1';
            button.addEventListener('click', () => {
                const doctorId = button.getAttribute('data-doc-id') || '';
                openAppointmentForDoctor(doctorId);
            });
        });
    }

    // ==========================================================================
    // 5. HYDRATION & RENDERING
    // ==========================================================================
    function hydrateGlobalHeaderFooter() {
        const d = state.data;
        const address = (d.addresses && d.addresses[0]) || {};
        const contact = d.contact || {};
        const meta = d.meta || {};

        document.getElementById('top-emergency-phone').innerText = `Emergency: ${contact.ambulance || ''}`;
        document.getElementById('brand-name').innerText = meta.shortName || '';
        document.getElementById('footer-desc').innerText = `${meta.name || ''} provides ${meta.type || ''} services in the ${meta.regionFocus || ''}.`;

        const fContact = document.getElementById('footer-contact-list');
        fContact.textContent = '';

        const contactRows = [
            { icon: 'fa-location-dot', text: joinNonEmpty([address.line1, address.city]) },
            { icon: 'fa-phone', text: contact.mainPhone || '' },
            { icon: 'fa-envelope', text: contact.emailGeneral || '' },
            { icon: 'fa-clock', text: contact.supportHours || '' }
        ];

        contactRows.forEach((row) => {
            if (!row.text) return;
            const li = document.createElement('li');
            const icon = document.createElement('i');
            icon.className = `fa-solid ${row.icon} w-5 text-primary-400`;
            li.appendChild(icon);
            li.appendChild(document.createTextNode(` ${row.text}`));
            fContact.appendChild(li);
        });

        const fAccred = document.getElementById('footer-accreditations');
        fAccred.textContent = '';
        (d.accreditations || []).forEach((acc) => {
            const block = document.createElement('div');
            block.className = 'bg-slate-800 p-3 rounded flex items-center justify-center text-center text-xs font-bold border border-slate-700';
            block.textContent = `${acc.name || ''} (${acc.year || ''})`;
            fAccred.appendChild(block);
        });
    }

    function renderView(route) {
        const viewContainer = document.getElementById('router-view');
        if (!viewContainer) return;
        viewContainer.style.opacity = '0'; // Transition out
        
        setTimeout(() => {
            if (route === '' || route === 'home') viewContainer.innerHTML = buildHomeView();
            else if (route === 'departments') viewContainer.innerHTML = buildDepartmentsView();
            else if (route === 'doctors') viewContainer.innerHTML = buildDoctorsView();
            else if (route === 'facilities') viewContainer.innerHTML = buildFacilitiesView();
            else viewContainer.innerHTML = `<div class="p-20 text-center"><h2 class="text-3xl font-bold">404 - Page Not Found</h2><a href="./" class="text-primary-600 mt-4 inline-block">Return Home</a></div>`;
            
            viewContainer.style.opacity = '1'; // Transition in
            window.scrollTo(0, 0);
            bindActionHandlers(viewContainer);
            bindDoctorSearch(viewContainer);
            ui.initObservers(); // Re-bind observers for new DOM elements
        }, 300);
    }

    // --- HTML Builders for Routes ---
    function buildHomeView() {
        const d = state.data;
        const hero = (d.cmsContentBlocks || []).find(b => b.slug === 'hero') || {};
        const safeMetaType = escapeHTML(d.meta?.type || '');
        const safeHeroHeadline = escapeHTML(hero.headline || '');
        const safeHeroSubhead = escapeHTML(hero.subhead || '');
        const safePrimaryCta = escapeHTML(hero.ctaPrimary || 'Book Appointment');
        const safeSecondaryCta = escapeHTML(hero.ctaSecondary || 'Find a Doctor');
        const focusDepartments = (d.departments || []).slice(0, 6).map((dept) => `
            <li class="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">${escapeHTML(dept.name || '')}</li>
        `).join('');
        const homeFaqItems = [
            {
                question: 'How can I book an appointment at HUI General Hospital?',
                answer: 'Use the Book Appointment button, choose department and doctor, then submit your details. Our team confirms the slot by SMS.'
            },
            {
                question: 'Which specialties are available at HUI Hospital Hyderabad?',
                answer: 'Core specialties include cardiology, neurology, orthopedics, pediatrics and neonatology, oncology, radiology, and emergency trauma care.'
            },
            {
                question: 'Is emergency care available 24x7?',
                answer: 'Yes. Emergency and trauma support is available around the clock with access to diagnostics and critical care services.'
            }
        ];
        const homeFaqHtml = homeFaqItems.map((item) => `
            <details class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
                <summary class="cursor-pointer font-semibold text-slate-900 dark:text-white">${escapeHTML(item.question)}</summary>
                <p class="mt-3 text-slate-600 dark:text-slate-300">${escapeHTML(item.answer)}</p>
            </details>
        `).join('');

        // Build Stats
        const statsHtml = (d.sampleUiDataSlices?.statsStrip || []).map(stat => `
            <div class="stat-card p-6 text-center border-r border-slate-200 dark:border-slate-700 last:border-0">
                <h3 class="font-heading font-bold text-4xl text-primary-600 dark:text-primary-400 mb-2 stat-value" data-target="${safeInt(stat.value, 0)}">0</h3>
                <p class="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">${escapeHTML(stat.label || '')}</p>
            </div>
        `).join('');

        // Build Departments Preview (Top 4)
        const deptsHtml = (d.departments || []).slice(0, 4).map(dept => buildDepartmentCard(dept)).join('');

        return `
            <section class="relative bg-dark text-white pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden">
                <div class="absolute inset-0 z-0">
                    <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2000" alt="Hospital building" class="w-full h-full object-cover opacity-30" loading="eager" fetchpriority="high" decoding="async">
                    <div class="hero-gradient-overlay absolute inset-0"></div>
                </div>
                <div class="container mx-auto px-4 md:px-8 relative z-10">
                    <div class="max-w-3xl animate-fade-in-up">
                        <span class="inline-block py-1 px-3 rounded-full bg-primary-600/30 border border-primary-500 text-primary-100 text-sm font-semibold mb-6 backdrop-blur-sm">${safeMetaType}</span>
                        <h1 class="h1 mb-6 text-white">${safeHeroHeadline}</h1>
                        <p class="text-xl text-slate-300 mb-10 max-w-2xl leading-relaxed">${safeHeroSubhead}</p>
                        <div class="flex flex-col sm:flex-row gap-4">
                            <button class="js-open-appointment btn bg-primary-600 hover:bg-primary-500 text-white text-lg py-4 px-8 shadow-glow border border-transparent">
                                ${safePrimaryCta}
                            </button>
                            <a href="doctors.html" class="btn bg-white/10 hover:bg-white/20 text-white text-lg py-4 px-8 backdrop-blur-sm border border-white/20">
                                ${safeSecondaryCta}
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <section class="bg-primary-50 dark:bg-slate-900/50 border-y border-primary-100 dark:border-slate-800">
                <div class="container mx-auto px-4 md:px-8 py-8">
                    <p class="text-slate-700 dark:text-slate-200 text-sm md:text-base">
                        HUI General Hospital is a trusted multi speciality hospital in Hyderabad for emergency care, specialist consultations, diagnostics, and planned procedures.
                    </p>
                </div>
            </section>

            <section class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 relative z-20 -mt-10 mx-4 md:mx-auto md:max-w-6xl rounded-2xl shadow-xl">
                <div class="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
                    ${statsHtml}
                </div>
            </section>

            <section class="py-24 bg-surface dark:bg-dark">
                <div class="container mx-auto px-4 md:px-8">
                    <div class="flex justify-between items-end mb-12 fade-in-section">
                        <div>
                            <h2 class="h2 mb-4 text-slate-900 dark:text-white">Centers of Excellence</h2>
                            <p class="text-slate-500 dark:text-slate-400 max-w-2xl">Advanced multi-disciplinary care across specialized departments.</p>
                        </div>
                        <a href="departments.html" class="hidden md:flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                            View All <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        ${deptsHtml}
                    </div>
                </div>
            </section>

            <section class="py-20 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
                <div class="container mx-auto px-4 md:px-8">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                        <div>
                            <h2 class="h3 mb-4 text-slate-900 dark:text-white">Why Patients Choose HUI General Hospital in Hyderabad</h2>
                            <p class="text-slate-600 dark:text-slate-300 mb-4">
                                HUI General Hospital provides multi-speciality tertiary care for families in Hyderabad, Secunderabad, and nearby Telangana regions.
                                Patients can consult specialists, access diagnostics, and book appointments online from one platform.
                            </p>
                            <p class="text-slate-600 dark:text-slate-300">
                                Explore our dedicated pages for
                                <a href="doctors.html" class="text-primary-600 font-semibold hover:underline">specialist doctors</a>,
                                <a href="departments.html" class="text-primary-600 font-semibold hover:underline">medical departments</a>, and
                                <a href="facilities.html" class="text-primary-600 font-semibold hover:underline">critical care facilities</a>.
                            </p>
                            <p class="text-slate-600 dark:text-slate-300 mt-3">
                                Popular local searches:
                                <a href="doctor-appointment-hyderabad.html" class="text-primary-600 font-semibold hover:underline">doctor appointment in Hyderabad</a>,
                                <a href="emergency-hospital-hyderabad.html" class="text-primary-600 font-semibold hover:underline">emergency hospital in Hyderabad</a>, and
                                <a href="cardiology-hospital-hyderabad.html" class="text-primary-600 font-semibold hover:underline">cardiology hospital in Hyderabad</a>.
                            </p>
                        </div>
                        <div>
                            <h3 class="font-heading text-xl font-bold mb-4 text-slate-900 dark:text-white">Popular Specialties</h3>
                            <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                ${focusDepartments}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <section class="py-20 bg-slate-50 dark:bg-slate-800">
                <div class="container mx-auto px-4 md:px-8 max-w-4xl">
                    <h2 class="h3 mb-8 text-slate-900 dark:text-white">Frequently Asked Questions</h2>
                    <div class="space-y-4">
                        ${homeFaqHtml}
                    </div>
                </div>
            </section>
        `;
    }

    function buildDepartmentsView() {
        const d = state.data;
        const gridHtml = (d.departments || []).map(dept => buildDepartmentCard(dept)).join('');
        const quickDepartmentList = (d.departments || []).map((dept) => `
            <li class="text-sm text-slate-600 dark:text-slate-300">${escapeHTML(dept.name || '')}</li>
        `).join('');
        return `
            <div class="bg-slate-50 dark:bg-slate-800 py-16 border-b border-slate-200 dark:border-slate-800">
                <div class="container mx-auto px-4 md:px-8 text-center max-w-3xl">
                    <h1 class="h1 mb-6">Medical Departments</h1>
                    <p class="text-lg text-slate-500 dark:text-slate-400">Comprehensive healthcare services designed around your needs, available 24/7.</p>
                </div>
            </div>
            <div class="container mx-auto px-4 md:px-8 py-16">
                <div class="grid-auto-fit-lg">
                    ${gridHtml}
                </div>
            </div>
            <section class="pb-16">
                <div class="container mx-auto px-4 md:px-8">
                    <div class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 md:p-8">
                        <h2 class="h3 mb-4">Department-Based Care Pathway</h2>
                        <p class="text-slate-600 dark:text-slate-300 mb-5">
                            Our Hyderabad care model connects consultation, diagnostics, treatment planning, and follow-up across departments to reduce delays and improve outcomes.
                        </p>
                        <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                            ${quickDepartmentList}
                        </ul>
                        <p class="text-slate-600 dark:text-slate-300">
                            Continue to the
                            <a href="doctors.html" class="text-primary-600 font-semibold hover:underline">doctor directory</a>
                            to select a specialist aligned with your department.
                        </p>
                    </div>
                </div>
            </section>
        `;
    }

    function buildDoctorsView() {
        const d = state.data;
        const gridHtml = (d.doctors || []).map(doc => buildDoctorCard(doc)).join('');
        const specialtyListHtml = (d.doctors || []).map((doctor) => `
            <li class="text-sm text-slate-600 dark:text-slate-300">${escapeHTML(doctor.specialization || '')}</li>
        `).join('');
        return `
            <div class="bg-primary-900 text-white py-16">
                <div class="container mx-auto px-4 md:px-8">
                    <h1 class="h1 mb-4">Specialist Doctors in Hyderabad</h1>
                    <p class="text-primary-200 text-lg max-w-2xl mb-8">Meet experienced specialists across emergency medicine, cardiology, neurology, orthopedics, pediatrics, and oncology.</p>
                    
                    <div class="bg-white/10 p-2 rounded-xl backdrop-blur-sm max-w-2xl flex border border-white/20">
                        <div class="flex-grow flex items-center px-4">
                            <i class="fa-solid fa-magnifying-glass text-primary-300 mr-3"></i>
                            <input type="text" placeholder="Search by name or specialty..." class="bg-transparent border-none text-white w-full focus:outline-none placeholder-primary-300" id="doc-search">
                        </div>
                        <button id="doc-search-btn" type="button" class="bg-primary-500 hover:bg-primary-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors">Search</button>
                    </div>
                </div>
            </div>
            <div class="container mx-auto px-4 md:px-8 py-16">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="doctors-grid">
                    ${gridHtml}
                </div>
            </div>
            <section class="pb-16">
                <div class="container mx-auto px-4 md:px-8">
                    <div class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 md:p-8">
                        <h2 class="h3 mb-4">Find The Right Doctor by Specialty</h2>
                        <p class="text-slate-600 dark:text-slate-300 mb-5">
                            Use specialty and department matching to book consultations faster. If you know the doctor, choose them first and the form will auto-map the correct department.
                        </p>
                        <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                            ${specialtyListHtml}
                        </ul>
                        <p class="text-slate-600 dark:text-slate-300">
                            For department-first booking, visit
                            <a href="departments.html" class="text-primary-600 font-semibold hover:underline">medical departments</a>.
                        </p>
                    </div>
                </div>
            </section>
        `;
    }

    function buildFacilitiesView() {
        const d = state.data;
        const meta = d.meta || {};
        const metrics = [
            { label: 'Total Beds', value: safeInt(meta.totalBeds, 0) },
            { label: 'ICU Beds', value: safeInt(meta.icuBeds, 0) },
            { label: 'Operation Theaters', value: safeInt(meta.operationTheaters, 0) },
            { label: 'Annual Surgeries', value: safeInt(meta.annualSurgeries, 0) }
        ];

        const metricsHtml = metrics.map((metric) => `
            <div class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
                <div class="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">${escapeHTML(metric.label)}</div>
                <div class="mt-2 font-heading text-3xl font-bold text-primary-600 dark:text-primary-400">${metric.value.toLocaleString()}</div>
            </div>
        `).join('');

        const accreditationHtml = (d.accreditations || []).map((acc) => `
            <li class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3">
                <span class="font-semibold text-slate-800 dark:text-slate-200">${escapeHTML(acc.name || '')}</span>
                <span class="ml-2 text-slate-500 dark:text-slate-400">(${escapeHTML(String(acc.year || 'N/A'))})</span>
            </li>
        `).join('');

        return `
            <div class="bg-slate-50 dark:bg-slate-800 py-16 border-b border-slate-200 dark:border-slate-800">
                <div class="container mx-auto px-4 md:px-8 text-center max-w-3xl">
                    <h1 class="h1 mb-6">Hospital Facilities in Hyderabad</h1>
                    <p class="text-lg text-slate-500 dark:text-slate-400">
                        Critical care, diagnostics, and surgical infrastructure designed for reliable tertiary care delivery.
                    </p>
                </div>
            </div>
            <div class="container mx-auto px-4 md:px-8 py-16 space-y-12">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    ${metricsHtml}
                </div>
                <section class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-6 md:p-8">
                    <h2 class="h3 mb-4">Accreditations</h2>
                    <ul class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        ${accreditationHtml}
                    </ul>
                </section>
                <section class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 md:p-8">
                    <h2 class="h3 mb-4">Emergency, ICU, and Diagnostic Readiness</h2>
                    <p class="text-slate-600 dark:text-slate-300 mb-4">
                        HUI Hospital infrastructure supports rapid triage, critical care stabilization, and specialist referral workflows under one roof.
                    </p>
                    <p class="text-slate-600 dark:text-slate-300">
                        To schedule specialist consultation after diagnostics, continue to the
                        <a href="doctors.html" class="text-primary-600 font-semibold hover:underline">doctor directory</a>
                        or directly
                        <button class="js-open-appointment text-primary-600 font-semibold hover:underline" type="button">book an appointment</button>.
                    </p>
                </section>
            </div>
        `;
    }

    // --- Component Generators (using templates from index.html) ---
    function getDepartmentSeoPagePath(department) {
        const departmentId = String(department?.id || '').trim();
        const departmentPageMap = {
            'dep-01': 'department-cardiology-hyderabad.html',
            'dep-02': 'department-neurology-hyderabad.html',
            'dep-03': 'department-orthopedics-hyderabad.html',
            'dep-04': 'department-pediatrics-neonatology-hyderabad.html',
            'dep-05': 'department-oncology-hyderabad.html',
            'dep-06': 'department-radiology-imaging-hyderabad.html',
            'dep-07': 'department-emergency-trauma-hyderabad.html'
        };
        if (departmentPageMap[departmentId]) return departmentPageMap[departmentId];

        const safeName = String(department?.name || 'department')
            .toLowerCase()
            .replace(/&/g, ' and ')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        return `department-${safeName || 'general'}-hyderabad.html`;
    }

    function buildDepartmentCard(dept) {
        const tpl = document.getElementById('tpl-department-card');
        const clone = tpl.content.cloneNode(true);
        const safeDept = dept || {};
        
        // Mock icons based on name
        const iconMap = { Cardiology: 'fa-heart-pulse', Neurology: 'fa-brain', Orthopedics: 'fa-bone', Pediatrics: 'fa-baby', Radiology: 'fa-x-ray', Emergency: 'fa-truck-medical' };
        const deptName = String(safeDept.name || '');
        const iconClass = iconMap[deptName.split(' ')[0]] || 'fa-stethoscope';

        const iconContainer = clone.querySelector('.icon-container');
        iconContainer.textContent = '';
        const icon = document.createElement('i');
        icon.className = `fa-solid ${iconClass}`;
        iconContainer.appendChild(icon);

        clone.querySelector('.dept-name').innerText = deptName;
        clone.querySelector('.dept-desc').innerText = String(safeDept.description || '');
        
        const pill = clone.querySelector('.tag-pill');
        if (Array.isArray(safeDept.tags) && safeDept.tags.length > 0) {
            pill.innerText = String(safeDept.tags[0]);
            if(safeDept.tags[0] === '24/7') pill.classList.add('bg-red-100', 'text-red-700', 'dark:bg-red-900/40', 'dark:text-red-400');
        } else {
            pill.style.display = 'none';
        }

        const deptLink = clone.querySelector('.dept-link');
        if (deptLink) {
            const departmentPagePath = getDepartmentSeoPagePath(safeDept);
            deptLink.setAttribute('href', departmentPagePath);
            deptLink.setAttribute('aria-label', `Explore ${deptName} services`);
        }

        // Return outerHTML of the wrapper (hack for template clones in string building)
        const wrapper = document.createElement('div');
        wrapper.appendChild(clone);
        return wrapper.innerHTML;
    }

    function buildDoctorCard(doc) {
        const tpl = document.getElementById('tpl-doctor-card');
        const clone = tpl.content.cloneNode(true);

        const safeDoc = doc || {};
        const safeName = String(safeDoc.name || '');
        const safeSpec = String(safeDoc.specialization || '');
        clone.querySelector('.doc-name').innerText = safeName;
        clone.querySelector('.doc-spec').innerText = safeSpec;
        clone.querySelector('.doc-qual').innerText = String(safeDoc.qualification || '');
        clone.querySelector('.doc-fee').innerText = `INR ${safeInt(safeDoc.consultationFeeINR, 0)}`;

        const tagsContainer = clone.querySelector('.doc-tags');
        (Array.isArray(safeDoc.languages) ? safeDoc.languages : []).slice(0, 2).forEach(lang => {
            const span = document.createElement('span');
            span.className = 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[10px] font-bold px-2 py-1 rounded-md uppercase';
            span.innerText = String(lang || '');
            tagsContainer.appendChild(span);
        });

        const docCard = clone.querySelector('.doctor-card');
        const searchBlob = `${safeName} ${safeSpec}`.trim().toLowerCase();
        docCard.setAttribute('data-search', searchBlob);

        const bookBtn = clone.querySelector('.book-btn');
        bookBtn.setAttribute('data-doc-id', String(safeDoc.id || ''));

        const wrapper = document.createElement('div');
        wrapper.appendChild(clone);
        return wrapper.innerHTML;
    }

    // ==========================================================================
    // 6. FORM HANDLING
    // ==========================================================================
    function applyFieldConstraints(control, field) {
        ['min', 'max', 'pattern', 'maxlength', 'minlength', 'step'].forEach((constraint) => {
            const value = field[constraint];
            if (value !== undefined && value !== null && value !== '') {
                control.setAttribute(constraint, String(value));
            }
        });
    }

    function appendSelectOptions(select, field) {
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select...';
        select.appendChild(defaultOption);

        if (field.key === 'departmentId') {
            (state.data.departments || []).forEach((department) => {
                const option = document.createElement('option');
                option.value = String(department.id || '');
                option.textContent = String(department.name || '');
                select.appendChild(option);
            });
            return;
        }

        if (field.key === 'doctorId') {
            (state.data.doctors || []).forEach((doctor) => {
                const option = document.createElement('option');
                option.value = String(doctor.id || '');
                option.textContent = String(doctor.name || '');
                select.appendChild(option);
            });
            return;
        }

        if (Array.isArray(field.options)) {
            field.options.forEach((optionText) => {
                const option = document.createElement('option');
                option.value = String(optionText || '');
                option.textContent = String(optionText || '');
                select.appendChild(option);
            });
        }
    }

    function getAppointmentFieldByKey(key) {
        const fields = Array.isArray(state.data?.appointmentFormTemplate?.fields)
            ? state.data.appointmentFormTemplate.fields
            : [];
        return fields.find(field => field.key === key) || null;
    }

    function normalizeMatchText(value) {
        return String(value || '').toLowerCase().trim();
    }

    function tokenizeMatchText(value) {
        return normalizeMatchText(value)
            .replace(/[^a-z0-9]+/g, ' ')
            .split(/\s+/)
            .filter(token => token.length > 2);
    }

    function countTokenOverlap(tokensA, tokensB) {
        if (!tokensA.length || !tokensB.length) return 0;
        const tokenSet = new Set(tokensB);
        return tokensA.reduce((total, token) => total + (tokenSet.has(token) ? 1 : 0), 0);
    }

    function scoreDepartmentMatch(doctor, department) {
        const specialization = normalizeMatchText(doctor?.specialization);
        const departmentName = normalizeMatchText(department?.name);
        if (!specialization || !departmentName) return 0;

        let score = 0;
        const specializationTokens = tokenizeMatchText(specialization);
        const departmentTokens = tokenizeMatchText(departmentName);

        if (specialization.includes(departmentName)) score += 10;
        if (departmentName.includes(specialization)) score += 4;
        score += countTokenOverlap(specializationTokens, departmentTokens) * 3;

        (Array.isArray(department?.services) ? department.services : []).forEach((service) => {
            const normalizedService = normalizeMatchText(service);
            if (!normalizedService) return;
            if (specialization.includes(normalizedService) || normalizedService.includes(specialization)) score += 2;
            score += countTokenOverlap(specializationTokens, tokenizeMatchText(normalizedService));
        });

        return score;
    }

    function inferDepartmentIdByDoctor(doctorId) {
        const normalizedDoctorId = String(doctorId || '').trim();
        if (!normalizedDoctorId || !state.data) return '';
        if (appointmentDepartmentCache.has(normalizedDoctorId)) {
            return appointmentDepartmentCache.get(normalizedDoctorId) || '';
        }

        const departments = Array.isArray(state.data.departments) ? state.data.departments : [];
        const doctors = Array.isArray(state.data.doctors) ? state.data.doctors : [];
        const doctor = doctors.find(item => String(item.id || '') === normalizedDoctorId);
        if (!doctor) {
            appointmentDepartmentCache.set(normalizedDoctorId, '');
            return '';
        }

        const directDepartment = departments.find(dep => String(dep.headDoctorId || '') === normalizedDoctorId);
        if (directDepartment) {
            const directDepartmentId = String(directDepartment.id || '');
            appointmentDepartmentCache.set(normalizedDoctorId, directDepartmentId);
            return directDepartmentId;
        }

        let resolvedDepartmentId = '';
        let bestScore = 0;
        departments.forEach((department) => {
            const score = scoreDepartmentMatch(doctor, department);
            if (score > bestScore) {
                bestScore = score;
                resolvedDepartmentId = String(department.id || '');
            }
        });

        const finalDepartmentId = bestScore > 0 ? resolvedDepartmentId : '';
        appointmentDepartmentCache.set(normalizedDoctorId, finalDepartmentId);
        return finalDepartmentId;
    }

    function getDoctorsForDepartment(departmentId) {
        const normalizedDepartmentId = String(departmentId || '').trim();
        const doctors = Array.isArray(state.data?.doctors) ? state.data.doctors : [];
        if (!normalizedDepartmentId) return doctors.slice();
        return doctors.filter((doctor) => inferDepartmentIdByDoctor(doctor.id) === normalizedDepartmentId);
    }

    function getAppointmentControls() {
        const form = document.getElementById('appointment-form');
        if (!form) {
            return { form: null, departmentSelect: null, doctorSelect: null };
        }
        return {
            form,
            departmentSelect: form.querySelector('select[name="departmentId"]'),
            doctorSelect: form.querySelector('select[name="doctorId"]')
        };
    }

    function syncLockedDepartmentHiddenInput(form, departmentSelect) {
        if (!form || !departmentSelect) return;
        const hiddenInputSelector = 'input[type="hidden"][data-role="department-lock-value"]';
        const existingHidden = form.querySelector(hiddenInputSelector);

        if (departmentSelect.disabled) {
            const hidden = existingHidden || document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = departmentSelect.name;
            hidden.dataset.role = 'department-lock-value';
            hidden.value = String(departmentSelect.value || '');
            if (!existingHidden) form.appendChild(hidden);
            return;
        }

        if (existingHidden) existingHidden.remove();
    }

    function setDepartmentLock(locked, departmentLabel = '') {
        const { form, departmentSelect } = getAppointmentControls();
        if (!form || !departmentSelect) return;

        const isLocked = Boolean(locked);
        departmentSelect.disabled = isLocked;
        departmentSelect.setAttribute('aria-disabled', isLocked ? 'true' : 'false');
        departmentSelect.classList.toggle('cursor-not-allowed', isLocked);
        if (isLocked) {
            const label = departmentLabel ? ` (${departmentLabel})` : '';
            departmentSelect.title = `Department is locked for the selected doctor${label}.`;
        } else {
            departmentSelect.removeAttribute('title');
        }
        syncLockedDepartmentHiddenInput(form, departmentSelect);
    }

    function populateDoctorOptionsByDepartment(departmentId, preferredDoctorId = '') {
        const { doctorSelect } = getAppointmentControls();
        if (!doctorSelect) return;

        const currentValue = String(preferredDoctorId || doctorSelect.value || '').trim();
        const doctors = getDoctorsForDepartment(departmentId);
        const availableDoctorIds = new Set(doctors.map(doc => String(doc.id || '')));

        doctorSelect.textContent = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = doctors.length > 0 ? 'Select...' : 'No doctors available';
        doctorSelect.appendChild(defaultOption);

        doctors.forEach((doctor) => {
            const option = document.createElement('option');
            option.value = String(doctor.id || '');
            option.textContent = String(doctor.name || '');
            doctorSelect.appendChild(option);
        });

        doctorSelect.value = availableDoctorIds.has(currentValue) ? currentValue : '';
    }

    function bindAppointmentRelationshipHandlers() {
        const { form, departmentSelect, doctorSelect } = getAppointmentControls();
        if (!form || !departmentSelect || !doctorSelect) return;
        if (form.dataset.relationshipBound === '1') return;
        form.dataset.relationshipBound = '1';

        departmentSelect.addEventListener('change', () => {
            if (appointmentContext.lockDepartment) return;
            const selectedDepartmentId = String(departmentSelect.value || '').trim();
            populateDoctorOptionsByDepartment(selectedDepartmentId, '');
        });

        doctorSelect.addEventListener('change', () => {
            const selectedDoctorId = String(doctorSelect.value || '').trim();
            if (!selectedDoctorId) return;

            const inferredDepartmentId = inferDepartmentIdByDoctor(selectedDoctorId);
            if (!inferredDepartmentId) return;

            if (departmentSelect.value !== inferredDepartmentId) {
                departmentSelect.value = inferredDepartmentId;
                syncLockedDepartmentHiddenInput(form, departmentSelect);
            }
            populateDoctorOptionsByDepartment(inferredDepartmentId, selectedDoctorId);
        });
    }

    function applyAppointmentContext() {
        const { form, departmentSelect, doctorSelect } = getAppointmentControls();
        if (!form || !departmentSelect || !doctorSelect) return;

        bindAppointmentRelationshipHandlers();

        const selectedDoctorId = String(appointmentContext.selectedDoctorId || '').trim();
        const inferredDepartmentId = selectedDoctorId ? inferDepartmentIdByDoctor(selectedDoctorId) : '';
        const shouldLockDepartment = Boolean(appointmentContext.lockDepartment && inferredDepartmentId);

        if (shouldLockDepartment) {
            departmentSelect.value = inferredDepartmentId;
            populateDoctorOptionsByDepartment(inferredDepartmentId, selectedDoctorId);

            const departmentName = String(
                (Array.isArray(state.data?.departments) ? state.data.departments : [])
                    .find(dep => String(dep.id || '') === inferredDepartmentId)?.name || ''
            );
            setDepartmentLock(true, departmentName);
            return;
        }

        setDepartmentLock(false);

        if (selectedDoctorId) {
            if (inferredDepartmentId) {
                departmentSelect.value = inferredDepartmentId;
            }
            populateDoctorOptionsByDepartment(inferredDepartmentId || departmentSelect.value, selectedDoctorId);
            return;
        }

        populateDoctorOptionsByDepartment(departmentSelect.value, doctorSelect.value);
    }

    function validateAndNormalizeBookingData(rawData) {
        const departments = new Set((state.data?.departments || []).map(dep => String(dep.id || '')));
        const doctors = new Set((state.data?.doctors || []).map(doc => String(doc.id || '')));

        const genderField = getAppointmentFieldByKey('patientGender');
        const genderOptions = new Set((genderField?.options || []).map(option => String(option)));
        const phoneField = getAppointmentFieldByKey('contactPhone');
        const reasonField = getAppointmentFieldByKey('reason');

        const phonePattern = String(phoneField?.pattern || '').trim();
        let phoneRegex = /^[+0-9\s-]{7,20}$/;
        if (phonePattern) {
            try {
                phoneRegex = new RegExp(phonePattern);
            } catch (_error) {
                // Keep fallback regex if template pattern is invalid.
            }
        }

        const payload = {
            departmentId: String(rawData.departmentId || '').trim(),
            doctorId: String(rawData.doctorId || '').trim(),
            patientName: String(rawData.patientName || '').trim(),
            patientAge: safeInt(rawData.patientAge, -1),
            patientGender: String(rawData.patientGender || '').trim(),
            contactPhone: String(rawData.contactPhone || '').trim(),
            preferredDate: String(rawData.preferredDate || '').trim(),
            reason: String(rawData.reason || '').trim(),
            consent: rawData.consent === 'on' || rawData.consent === true || rawData.consent === 'true'
        };

        if (!departments.has(payload.departmentId)) {
            return { ok: false, message: 'Please select a valid department.' };
        }
        if (payload.doctorId && !doctors.has(payload.doctorId)) {
            return { ok: false, message: 'Please select a valid doctor.' };
        }
        if (payload.doctorId) {
            const inferredDepartmentId = inferDepartmentIdByDoctor(payload.doctorId);
            if (inferredDepartmentId && inferredDepartmentId !== payload.departmentId) {
                return { ok: false, message: 'Selected doctor does not belong to the chosen department.' };
            }
        }
        if (payload.patientName.length < 2 || payload.patientName.length > 80) {
            return { ok: false, message: 'Patient name must be between 2 and 80 characters.' };
        }
        if (!Number.isInteger(payload.patientAge) || payload.patientAge < 0 || payload.patientAge > 120) {
            return { ok: false, message: 'Patient age must be between 0 and 120.' };
        }
        if ((genderOptions.size > 0 && !genderOptions.has(payload.patientGender)) || (!payload.patientGender && genderOptions.size === 0)) {
            return { ok: false, message: 'Please select a valid gender value.' };
        }
        if (!phoneRegex.test(payload.contactPhone)) {
            return { ok: false, message: 'Please enter a valid contact phone number.' };
        }
        if (payload.preferredDate) {
            const isISODate = /^\d{4}-\d{2}-\d{2}$/.test(payload.preferredDate);
            if (!isISODate) {
                return { ok: false, message: 'Preferred date must be in YYYY-MM-DD format.' };
            }

            const selectedDate = new Date(`${payload.preferredDate}T00:00:00`);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (Number.isNaN(selectedDate.getTime()) || selectedDate < today) {
                return { ok: false, message: 'Preferred date cannot be in the past.' };
            }
        }

        const maxReasonLength = safeInt(reasonField?.maxlength, 600);
        if (payload.reason.length > maxReasonLength) {
            return { ok: false, message: `Reason cannot exceed ${maxReasonLength} characters.` };
        }
        if (!payload.consent) {
            return { ok: false, message: 'Consent is required to continue.' };
        }

        return { ok: true, data: payload };
    }

    function populateAppointmentForm() {
        const container = document.getElementById('form-fields-container');
        if (container.children.length > 0) {
            bindAppointmentRelationshipHandlers();
            return; // Already populated
        }

        const template = Array.isArray(state.data?.appointmentFormTemplate?.fields)
            ? state.data.appointmentFormTemplate.fields
            : [];
        const fragment = document.createDocumentFragment();

        template.forEach((field, index) => {
            const normalizedType = String(field.type || 'text').toLowerCase();
            const isFullWidth = normalizedType === 'textarea' || normalizedType === 'checkbox';
            const fieldKey = sanitizeFieldKey(field.key || `field-${index}`);
            if (!fieldKey) return;

            const fieldId = `field-${fieldKey}`;
            const labelText = String(field.label || fieldKey);
            const required = Boolean(field.required);

            const wrapper = document.createElement('div');
            if (isFullWidth) wrapper.className = 'md:col-span-2';

            if (normalizedType === 'checkbox') {
                const row = document.createElement('div');
                row.className = 'flex items-start gap-3 mt-2';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.name = fieldKey;
                checkbox.id = fieldId;
                checkbox.className = 'custom-checkbox mt-1';
                checkbox.required = required;
                applyFieldConstraints(checkbox, field);

                const label = document.createElement('label');
                label.setAttribute('for', fieldId);
                label.className = 'text-sm text-slate-600 dark:text-slate-400 cursor-pointer';
                label.appendChild(document.createTextNode(labelText));
                if (required) {
                    label.appendChild(document.createTextNode(' '));
                    const star = document.createElement('span');
                    star.className = 'text-red-500';
                    star.textContent = '*';
                    label.appendChild(star);
                }

                row.appendChild(checkbox);
                row.appendChild(label);
                wrapper.appendChild(row);
                fragment.appendChild(wrapper);
                return;
            }

            const label = document.createElement('label');
            label.setAttribute('for', fieldId);
            label.className = 'form-label';
            label.appendChild(document.createTextNode(labelText));
            if (required) {
                label.appendChild(document.createTextNode(' '));
                const star = document.createElement('span');
                star.className = 'text-red-500';
                star.textContent = '*';
                label.appendChild(star);
            }

            let control;
            if (normalizedType === 'select') {
                control = document.createElement('select');
                control.className = 'form-select';
                appendSelectOptions(control, field);
            } else if (normalizedType === 'textarea') {
                control = document.createElement('textarea');
                control.className = 'form-textarea';
                control.placeholder = 'Optional notes...';
            } else {
                control = document.createElement('input');
                control.type = VALID_INPUT_TYPES.has(normalizedType) ? normalizedType : 'text';
                control.className = 'form-input';
                control.placeholder = labelText;
            }

            control.name = fieldKey;
            control.id = fieldId;
            control.required = required;
            applyFieldConstraints(control, field);

            wrapper.appendChild(label);
            wrapper.appendChild(control);
            fragment.appendChild(wrapper);
        });

        container.textContent = '';
        container.appendChild(fragment);

        // Bind form submit
        const form = document.getElementById('appointment-form');
        if (form && form.dataset.submitBound !== '1') {
            form.addEventListener('submit', handleFormSubmit);
            form.dataset.submitBound = '1';
        }
        bindAppointmentRelationshipHandlers();
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        
        // Basic HTML5 Validation Check
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Gather Data
        const formData = new FormData(form);
        const rawData = Object.fromEntries(formData.entries());
        const validation = validateAndNormalizeBookingData(rawData);
        if (!validation.ok) {
            ui.showToast('error', 'Invalid Form Data', validation.message);
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const labelNode = submitBtn.querySelector('span');
        const iconNode = submitBtn.querySelector('i');
        const originalLabel = labelNode ? labelNode.textContent : submitBtn.textContent;

        if (labelNode) labelNode.textContent = 'Processing...';
        if (iconNode) iconNode.className = 'fa-solid fa-spinner fa-spin';
        submitBtn.disabled = true;

        try {
            await api.submitBooking(validation.data);
            ui.showToast('success', 'Booking Confirmed!', 'You will receive an SMS confirmation shortly.');
            modals.close('appointment-modal');
            form.reset();
        } catch (error) {
            ui.showToast('error', 'Booking Failed', error.message);
        } finally {
            if (labelNode) labelNode.textContent = originalLabel;
            if (iconNode) iconNode.className = 'fa-solid fa-arrow-right';
            submitBtn.disabled = false;
        }
    }

    // ==========================================================================
    // 7. ROUTER & INITIALIZATION
    // ==========================================================================
    function router() {
        if(state.isNavigating) return;
        state.isNavigating = true;
        
        let hash = window.location.hash.slice(1);
        if (!hash) hash = 'home';
        state.currentRoute = hash;
        updateRouteSeo(hash);

        // Update active nav links
        document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
            const href = String(link.getAttribute('href') || '').trim();
            const normalizedHref = href.replace(/^\.?\//, '');
            const routePageMap = {
                home: '',
                departments: 'departments.html',
                doctors: 'doctors.html',
                facilities: 'facilities.html'
            };
            const routePage = routePageMap[hash];
            const isHashLink = href.startsWith('#');
            const isActive = isHashLink
                ? href === `#${hash}`
                : (
                    (hash === 'home' && (normalizedHref === '' || normalizedHref === 'index.html' || normalizedHref === '/')) ||
                    (routePage && normalizedHref.endsWith(routePage))
                );
            link.classList.toggle('active', isActive);
            if (isActive) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });

        renderView(hash);
        
        // Close mobile menu if open
        document.getElementById('mobile-menu').classList.add('translate-x-full');
        
        setTimeout(() => state.isNavigating = false, 350);
    }

    async function init() {
        // Setup Progress Indicator
        const progress = document.createElement('div');
        progress.id = 'scroll-progress';
        document.body.appendChild(progress);
        window.addEventListener('scroll', ui.updateScrollProgress);
        clearLegacyBookingStorage();

        // Fetch Initial Data
        const loader = document.getElementById('initial-loader');
        try {
            await api.fetchData();
            hydrateGlobalHeaderFooter();
            injectStructuredData();
            
            // Setup Theme
            applyTheme(state.theme);
            document.getElementById('theme-toggle').addEventListener('click', ui.toggleTheme);
            document.getElementById('mobile-theme-toggle').addEventListener('click', ui.toggleTheme);

            // Setup Mobile Menu
            const mobileMenu = document.getElementById('mobile-menu');
            document.getElementById('mobile-menu-btn').addEventListener('click', () => mobileMenu.classList.remove('translate-x-full'));
            document.getElementById('close-menu-btn').addEventListener('click', () => mobileMenu.classList.add('translate-x-full'));
            bindActionHandlers(document);

            // Initial Route
            window.addEventListener('hashchange', router);
            router(); // Call once on load

        } catch (error) {
            loader.textContent = '';
            const errorNode = document.createElement('div');
            errorNode.className = 'text-red-500 text-xl font-bold';
            const icon = document.createElement('i');
            icon.className = 'fa-solid fa-triangle-exclamation';
            errorNode.appendChild(icon);
            errorNode.appendChild(document.createTextNode(' Failed to load application data.'));
            loader.appendChild(errorNode);
        }
    }

    // Expose public API
    return {
        init,
        openModal: modals.open.bind(modals),
        closeModal: modals.close.bind(modals)
    };
})();

// Bootstrap the App
document.addEventListener('DOMContentLoaded', app.init);
