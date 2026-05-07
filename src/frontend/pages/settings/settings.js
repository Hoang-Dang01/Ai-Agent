(function() {
    let settings = {};
    try {
        settings = JSON.parse(localStorage.getItem('ai_study_hub_settings') || '{}');
    } catch(e) {
        settings = {};
    }
    
    let currentSettings = {
        darkMode: settings.darkMode !== false,
        primaryColor: settings.primaryColor || '#3b82f6',
        fontFamily: settings.fontFamily || 'Inter',
        lang: settings.lang || 'vi',
        sidebarStyle: settings.sidebarStyle || 'cardnav'
    };

    function updateUI() {
        // Update Theme
        document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
        const themeCard = document.querySelector(`.theme-card[data-theme="${currentSettings.darkMode ? 'dark' : 'light'}"]`);
        if (themeCard) themeCard.classList.add('active');

        // Update Font
        document.querySelectorAll('.font-card').forEach(c => c.classList.remove('active'));
        const fontCard = document.querySelector(`.font-card[data-font="${currentSettings.fontFamily}"]`);
        if (fontCard) fontCard.classList.add('active');

        // Update Layout
        document.querySelectorAll('.layout-card').forEach(c => c.classList.remove('active'));
        const layoutCard = document.querySelector(`.layout-card[data-layout="${currentSettings.sidebarStyle}"]`);
        if (layoutCard) layoutCard.classList.add('active');

        // Update Color
        document.querySelectorAll('.color-circle').forEach(c => c.classList.remove('active'));
        const colorCard = document.querySelector(`.color-circle[data-color="${currentSettings.primaryColor}"]`);
        if (colorCard) {
            colorCard.classList.add('active');
        } else {
            const pickerWrapper = document.querySelector('.color-picker-wrapper');
            if (pickerWrapper) {
                pickerWrapper.style.outline = `2px solid ${currentSettings.primaryColor}`;
                pickerWrapper.style.outlineOffset = '3px';
            }
        }
        
        document.documentElement.style.setProperty('--accent-blue', currentSettings.primaryColor);
        document.documentElement.style.setProperty('--font-primary', `"${currentSettings.fontFamily}", system-ui, sans-serif`);
    }

    function saveSettings() {
        localStorage.setItem('ai_study_hub_settings', JSON.stringify(currentSettings));
        if (window.triggerThemeUpdate) {
            window.triggerThemeUpdate();
        }
    }

    window.setDarkMode = function(isDark) {
        currentSettings.darkMode = isDark;
        saveSettings();
        updateUI();
    };

    window.setFont = function(font) {
        currentSettings.fontFamily = font;
        saveSettings();
        updateUI();
    };

    window.setSidebarStyle = function(style) {
        currentSettings.sidebarStyle = style;
        saveSettings();
        updateUI();
        
        const sidebar = document.getElementById('app-sidebar');
        if (sidebar) {
            if (style === 'classic') sidebar.classList.add('classic-mode');
            else sidebar.classList.remove('classic-mode');
        }
        
        window.dispatchEvent(new CustomEvent('layout-changed', { detail: { style } }));
    };

    window.setPrimaryColor = function(color) {
        currentSettings.primaryColor = color;
        saveSettings();
        updateUI();
        
        const pickerWrapper = document.querySelector('.color-picker-wrapper');
        if (pickerWrapper) pickerWrapper.style.outline = 'none';
    };

    const colorPickerFree = document.getElementById('color-picker-free');
    if (colorPickerFree) {
        colorPickerFree.addEventListener('input', (e) => {
            window.setPrimaryColor(e.target.value);
        });
    }

    updateUI();
})();
