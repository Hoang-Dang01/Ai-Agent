(function() {
    let settings = {};
    try {
        settings = JSON.parse(localStorage.getItem('ai_study_hub_settings') || '{}');
    } catch(e) {
        settings = {};
    }
    
    let currentSettings = {
        darkMode: settings.darkMode !== false,
        primaryColor: settings.primaryColor || '#6366f1',
        fontFamily: settings.fontFamily || 'Inter',
        lang: settings.lang || 'vi',
        sidebarStyle: settings.sidebarStyle || 'cardnav'
    };

    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const colorPicker = document.getElementById('color-picker');
    const fontSelect = document.getElementById('font-select');
    const langSelect = document.getElementById('lang-select');
    const sidebarStyleRadios = document.querySelectorAll('input[name="sidebar-style"]');

    function updateUI() {
        if (!darkModeToggle) return; // Prevent crashes if UI is missing
        if (currentSettings.darkMode) darkModeToggle.classList.add('active');
        else darkModeToggle.classList.remove('active');
        
        if (colorPicker) colorPicker.value = currentSettings.primaryColor;
        if (fontSelect) fontSelect.value = currentSettings.fontFamily;
        if (langSelect) langSelect.value = currentSettings.lang;
        
        const sbRadio = document.getElementById(`sb-${currentSettings.sidebarStyle}`);
        if (sbRadio) sbRadio.checked = true;
    }

    function saveSettings() {
        localStorage.setItem('ai_study_hub_settings', JSON.stringify(currentSettings));
        if (window.triggerThemeUpdate) {
            window.triggerThemeUpdate();
        }
    }

    window.setPrimaryColor = function(color) {
        currentSettings.primaryColor = color;
        updateUI();
        saveSettings();
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            currentSettings.darkMode = !currentSettings.darkMode;
            updateUI();
            saveSettings();
        });
    }

    if (colorPicker) {
        colorPicker.addEventListener('input', (e) => {
            currentSettings.primaryColor = e.target.value;
            saveSettings();
        });
    }

    if (fontSelect) {
        fontSelect.addEventListener('change', (e) => {
            currentSettings.fontFamily = e.target.value;
            saveSettings();
        });
    }

    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            currentSettings.lang = e.target.value;
            saveSettings();
        });
    }

    sidebarStyleRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentSettings.sidebarStyle = e.target.value;
            saveSettings();
            
            // Apply sidebar style visually if needed
            const sidebar = document.getElementById('app-sidebar');
            if (sidebar) {
                if (currentSettings.sidebarStyle === 'classic') {
                    sidebar.classList.add('classic-mode');
                } else {
                    sidebar.classList.remove('classic-mode');
                }
            }
        });
    });

    updateUI();
})();
