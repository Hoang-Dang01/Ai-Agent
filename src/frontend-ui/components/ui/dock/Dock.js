class Dock {
    constructor(container, items, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.items = items;
        this.baseItemSize = options.baseItemSize || 50;
        this.magnification = options.magnification || 70;
        this.distance = options.distance || 200;
        this.direction = options.direction || 'horizontal';
        
        this.init();
    }

    init() {
        this.container.classList.add('dock-panel');
        if (this.direction === 'vertical') {
            this.container.classList.add('dock-vertical');
        }
        
        // Clear container if re-initializing
        this.container.innerHTML = '';

        this.dockItems = this.items.map(item => {
            const el = document.createElement('div');
            el.className = `dock-item ${item.className || ''}`;
            el.style.width = `${this.baseItemSize}px`;
            el.style.height = `${this.baseItemSize}px`;
            
            const iconEl = document.createElement('div');
            iconEl.className = 'dock-icon';
            iconEl.innerHTML = item.icon;
            
            const labelEl = document.createElement('div');
            labelEl.className = 'dock-label';
            labelEl.textContent = item.label;
            
            el.appendChild(iconEl);
            el.appendChild(labelEl);
            
            if (item.onClick) {
                el.addEventListener('click', item.onClick);
            }
            if (item.id) {
                el.id = item.id;
            }
            if (item.href) {
                el.setAttribute('data-href', item.href);
            }
            
            this.container.appendChild(el);
            return el;
        });

        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        
        this.container.addEventListener('mousemove', this.handleMouseMove);
        this.container.addEventListener('mouseleave', this.handleMouseLeave);
    }

    destroy() {
        this.container.removeEventListener('mousemove', this.handleMouseMove);
        this.container.removeEventListener('mouseleave', this.handleMouseLeave);
        this.container.innerHTML = '';
        this.container.classList.remove('dock-panel', 'dock-vertical');
    }

    handleMouseMove(e) {
        requestAnimationFrame(() => {
            this.dockItems.forEach(item => {
                const rect = item.getBoundingClientRect();
                let dist = 0;
                
                if (this.direction === 'horizontal') {
                    const itemCenterX = rect.left + rect.width / 2;
                    dist = Math.abs(e.clientX - itemCenterX);
                } else {
                    const itemCenterY = rect.top + rect.height / 2;
                    dist = Math.abs(e.clientY - itemCenterY);
                }
                
                let targetSize = this.baseItemSize;
                if (dist < this.distance) {
                    const progress = 1 - (dist / this.distance);
                    targetSize = this.baseItemSize + (this.magnification - this.baseItemSize) * Math.sin(progress * Math.PI / 2);
                }
                
                item.style.width = `${targetSize}px`;
                item.style.height = `${targetSize}px`;
                
                if (this.direction === 'horizontal') {
                    const translateY = -((targetSize - this.baseItemSize) / 2);
                    item.style.transform = `translateY(${translateY}px)`;
                } else {
                    const translateX = ((targetSize - this.baseItemSize) / 2);
                    item.style.transform = `translateX(${translateX}px)`;
                }
            });
        });
    }

    handleMouseLeave() {
        requestAnimationFrame(() => {
            this.dockItems.forEach(item => {
                item.style.width = `${this.baseItemSize}px`;
                item.style.height = `${this.baseItemSize}px`;
                item.style.transform = `translate(0, 0)`;
            });
        });
    }
}

window.Dock = Dock;
