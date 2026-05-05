$(function() {
    const assistant = document.getElementById('ai-assistant');
    if (assistant && window.selectedAgent) {
        // Pass agent info to the web component
        setTimeout(() => {
            assistant.dispatchEvent(new CustomEvent('change-agent', { 
                detail: window.selectedAgent
            }));
        }, 100);
    }

    if (assistant) {
        // Listen for close event to navigate back to home
        assistant.addEventListener('close-chat', () => {
            navigate('home');
        });
    }
});
