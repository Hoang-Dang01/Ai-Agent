$(function() {
    const settings = JSON.parse(localStorage.getItem('ai_study_hub_settings') || '{}');
    let currentSettings = {
        darkMode: settings.darkMode !== false,
        primaryColor: settings.primaryColor || '#6366f1',
        fontFamily: settings.fontFamily || 'Inter',
        lang: settings.lang || 'vi'
    };

    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const colorPicker = document.getElementById('color-picker');
    const fontSelect = document.getElementById('font-select');
    const langSelect = document.getElementById('lang-select');

    function updateUI() {
        if (currentSettings.darkMode) darkModeToggle.classList.add('active');
        else darkModeToggle.classList.remove('active');
        colorPicker.value = currentSettings.primaryColor;
        fontSelect.value = currentSettings.fontFamily;
        langSelect.value = currentSettings.lang;
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

    darkModeToggle.addEventListener('click', () => {
        currentSettings.darkMode = !currentSettings.darkMode;
        updateUI();
        saveSettings();
    });

    colorPicker.addEventListener('input', (e) => {
        currentSettings.primaryColor = e.target.value;
        saveSettings();
    });

    fontSelect.addEventListener('change', (e) => {
        currentSettings.fontFamily = e.target.value;
        saveSettings();
    });

    langSelect.addEventListener('change', (e) => {
        currentSettings.lang = e.target.value;
        saveSettings();
    });

    updateUI();
});
