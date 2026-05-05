$(function() {
    const username = localStorage.getItem('username');
    if (username) {
        $('#user-display').text(username);
    }

    $('#btn-logout').on('click', function() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('username');
        window.location.href = '/login.html';
    });

    $('.glass-card').on('click', function() {
        const agentName = $(this).data('agent');
        const initialMessage = $(this).data('msg');
        
        // Store selected agent info to pass to chat view
        window.selectedAgent = { name: agentName, welcomeMsg: initialMessage };
        navigate('chat');
    });
});
