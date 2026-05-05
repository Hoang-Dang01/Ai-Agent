// theme-engine.js
(function() {
    function hexToRgb(hex) {
        let r = 0, g = 0, b = 0;
        if (hex.length == 4) {
            r = "0x" + hex[1] + hex[1];
            g = "0x" + hex[2] + hex[2];
            b = "0x" + hex[3] + hex[3];
        } else if (hex.length == 7) {
            r = "0x" + hex[1] + hex[2];
            g = "0x" + hex[3] + hex[4];
            b = "0x" + hex[5] + hex[6];
        }
        return +(r) + "," + +(g) + "," + +(b);
    }

    function applyTheme() {
        const savedSettings = JSON.parse(localStorage.getItem('ai_study_hub_settings') || '{}');
        
        // Default values
        const isDarkMode = savedSettings.darkMode !== false; // Default true
        const primaryColor = savedSettings.primaryColor || '#4F46E5'; // Default Premium Indigo
        const fontFamily = savedSettings.fontFamily || 'Plus Jakarta Sans';
        const primaryRgb = hexToRgb(primaryColor);
        
        const root = document.documentElement;
        
        // ui-core Design Tokens Integration
        root.style.setProperty('--color-primary', primaryColor);
        root.style.setProperty('--color-primary-hover', '#4338CA');
        root.style.setProperty('--color-primary-light', `rgba(${primaryRgb}, 0.1)`);
        
        root.style.setProperty('--color-success', '#10B981');
        root.style.setProperty('--color-warning', '#F59E0B');
        root.style.setProperty('--color-danger', '#F43F5E');
        root.style.setProperty('--color-info', '#0EA5E9');
        
        // Typography & Radiuses
        root.style.setProperty('--radius-sm', '8px');
        root.style.setProperty('--radius-md', '12px');
        root.style.setProperty('--radius-lg', '20px');
        root.style.setProperty('--radius-xl', '24px');
        root.style.setProperty('--transition-normal', '0.4s cubic-bezier(0.16, 1, 0.3, 1)');
        
        if (isDarkMode) {
            // Slate 900 Dark Theme
            root.style.setProperty('--color-background', '#0F172A');
            root.style.setProperty('--color-surface', '#1E293B');
            root.style.setProperty('--color-border', '#334155');
            root.style.setProperty('--color-border-strong', '#475569');
            root.style.setProperty('--color-text', '#F8FAFC');
            root.style.setProperty('--color-text-secondary', '#94A3B8');
            
            // Shadows for Dark Mode
            root.style.setProperty('--shadow-card', '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)');
            root.style.setProperty('--shadow-hover', '0 25px 30px -5px rgba(0, 0, 0, 0.4), 0 15px 15px -10px rgba(0, 0, 0, 0.3)');
            
            // Map legacy Ai-Agent variables
            root.style.setProperty('--bg-color', '#0F172A');
            root.style.setProperty('--card-bg', '#1E293B');
            root.style.setProperty('--card-border', '#334155');
            root.style.setProperty('--text-main', '#F8FAFC');
            root.style.setProperty('--text-muted', '#94A3B8');
        } else {
            // Slate 50 Light Theme
            root.style.setProperty('--color-background', '#F8FAFC');
            root.style.setProperty('--color-surface', '#FFFFFF');
            root.style.setProperty('--color-border', '#E2E8F0');
            root.style.setProperty('--color-border-strong', '#CBD5E1');
            root.style.setProperty('--color-text', '#1E293B');
            root.style.setProperty('--color-text-secondary', '#64748B');
            
            // Shadows for Light Mode
            root.style.setProperty('--shadow-card', '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)');
            root.style.setProperty('--shadow-hover', '0 25px 30px -5px rgba(0, 0, 0, 0.08), 0 15px 15px -10px rgba(0, 0, 0, 0.04)');
            
            // Map legacy Ai-Agent variables
            root.style.setProperty('--bg-color', '#F8FAFC');
            root.style.setProperty('--card-bg', '#FFFFFF');
            root.style.setProperty('--card-border', '#E2E8F0');
            root.style.setProperty('--text-main', '#0F172A');
            root.style.setProperty('--text-muted', '#475569');
        }

        root.style.setProperty('--accent-blue', primaryColor);
        root.style.setProperty('--accent-rgb', primaryRgb);
        root.style.setProperty('--font-primary', `"${fontFamily}", 'Plus Jakarta Sans', system-ui, sans-serif`);
    }

    applyTheme();

    // Listen for storage events to update in real-time across tabs
    window.addEventListener('storage', (e) => {
        if (e.key === 'ai_study_hub_settings') {
            applyTheme();
            // Dispatch custom event for shadow doms
            window.dispatchEvent(new CustomEvent('theme-changed'));
        }
    });

    // Provide a way to manually trigger it
    window.triggerThemeUpdate = () => {
        applyTheme();
        window.dispatchEvent(new CustomEvent('theme-changed'));
    };
})();
