// js/core/sidebar.js
window.SidebarManager = {
    init: function() {
        this.sidebar = document.getElementById('app-sidebar');
        this.overlay = document.getElementById('mobile-overlay');
        this.cards = document.querySelectorAll('.nav-card');
        this.magnetics = document.querySelectorAll('.magnetic');
        this.activeIndicator = document.getElementById('active-indicator');
        
        if (!this.sidebar) return;

        this.bindEvents();
        this.setupMagneticHover();
        this.updateActiveIndicator();
        this.setupTooltips();

        // Listen for route changes to update active state
        window.addEventListener('hashchange', () => {
            setTimeout(() => {
                this.updateActiveMenu();
                this.updateActiveIndicator();
            }, 50);
        });
        
        // Initial setup
        this.updateActiveMenu();
        setTimeout(() => this.updateActiveIndicator(), 500);
    },

    updateActiveMenu: function() {
        const hash = window.location.hash || '#/home';
        this.sidebar.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('active');
            if (hash.includes(el.getAttribute('data-route'))) {
                el.classList.add('active');
            }
        });
    },

    bindEvents: function() {
        // Global toggle function bound to window
        window.toggleSidebar = () => {
            if (window.innerWidth <= 1024) {
                this.sidebar.classList.toggle('show');
                this.overlay.classList.toggle('show');
            } else {
                const isCollapsed = this.sidebar.classList.contains('collapsed');
                if (isCollapsed) {
                    this.expandSidebar();
                } else {
                    this.collapseSidebar();
                }
            }
        };
    },

    expandSidebar: function() {
        this.sidebar.classList.remove('collapsed');
        // Animate cards staggering in with bounce effect
        gsap.fromTo(this.cards, 
            { y: 30, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(1.7)', clearProps: 'all' }
        );
        setTimeout(() => this.updateActiveIndicator(), 400); // Update indicator after expansion
    },

    collapseSidebar: function() {
        this.sidebar.classList.add('collapsed');
        this.activeIndicator.style.opacity = 0; // Hide indicator when collapsed
    },

    setupMagneticHover: function() {
        this.magnetics.forEach(el => {
            el.addEventListener('mousemove', (e) => {
                if (this.sidebar.classList.contains('collapsed')) return;
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                // Move element slightly towards cursor (Magnetic effect)
                gsap.to(el, {
                    x: x * 0.15,
                    y: y * 0.15,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });

            el.addEventListener('mouseleave', () => {
                // Snap back with elastic bounce
                gsap.to(el, {
                    x: 0,
                    y: 0,
                    duration: 0.6,
                    ease: 'elastic.out(1, 0.3)'
                });
            });
        });
    },

    updateActiveIndicator: function() {
        if (this.sidebar.classList.contains('collapsed')) {
            this.activeIndicator.style.opacity = 0;
            return;
        }
        
        const activeItem = this.sidebar.querySelector('.nav-item.active');
        if (!activeItem) {
            this.activeIndicator.style.opacity = 0;
            return;
        }

        const rect = activeItem.getBoundingClientRect();
        const sidebarRect = this.sidebar.getBoundingClientRect();
        
        // Relative to sidebar content container
        const top = rect.top - sidebarRect.top;
        const height = rect.height;

        this.activeIndicator.style.opacity = 1;
        gsap.to(this.activeIndicator, {
            y: top,
            height: height,
            duration: 0.5,
            ease: 'back.out(1.2)'
        });
    },

    setupTooltips: function() {
        // Create a single tooltip element
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'sidebar-tooltip';
        document.body.appendChild(this.tooltip);

        const navItems = this.sidebar.querySelectorAll('.nav-item, .logo');

        navItems.forEach(item => {
            item.addEventListener('mouseenter', (e) => {
                if (!this.sidebar.classList.contains('collapsed')) return;
                
                const text = item.getAttribute('data-tooltip') || (item.classList.contains('logo') ? 'AI Study Hub' : '');
                if (!text) return;

                this.tooltip.textContent = text;
                const rect = item.getBoundingClientRect();
                
                // Position tooltip
                gsap.killTweensOf(this.tooltip);
                gsap.set(this.tooltip, {
                    left: rect.right + 12,
                    top: rect.top + (rect.height / 2) - 18,
                    display: 'block'
                });

                gsap.fromTo(this.tooltip,
                    { opacity: 0, x: -10 },
                    { opacity: 1, x: 0, duration: 0.3, ease: 'back.out(1.5)' }
                );
            });

            item.addEventListener('mouseleave', () => {
                gsap.to(this.tooltip, {
                    opacity: 0,
                    x: -10,
                    duration: 0.2,
                    onComplete: () => {
                        this.tooltip.style.display = 'none';
                    }
                });
            });
        });
    }
};
