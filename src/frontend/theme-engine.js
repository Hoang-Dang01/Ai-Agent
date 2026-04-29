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
        const primaryColor = savedSettings.primaryColor || '#6366f1'; // Default Indigo
        const fontFamily = savedSettings.fontFamily || 'Inter';
        const primaryRgb = hexToRgb(primaryColor);
        
        const root = document.documentElement;
        
        if (isDarkMode) {
            root.style.setProperty('--bg-color', '#0f172a');
            root.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.03)');
            root.style.setProperty('--card-border', 'rgba(255, 255, 255, 0.08)');
            root.style.setProperty('--text-main', '#f8fafc');
            root.style.setProperty('--text-muted', '#94a3b8');
        } else {
            root.style.setProperty('--bg-color', '#f8fafc'); // Light background
            root.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.7)');
            root.style.setProperty('--card-border', 'rgba(0, 0, 0, 0.1)');
            root.style.setProperty('--text-main', '#0f172a');
            root.style.setProperty('--text-muted', '#475569');
        }

        root.style.setProperty('--accent-blue', primaryColor);
        root.style.setProperty('--accent-rgb', primaryRgb);
        root.style.setProperty('--font-primary', `"${fontFamily}", system-ui, sans-serif`);
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
