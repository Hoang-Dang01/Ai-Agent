$(function() {
    const username = localStorage.getItem('username');
    if (username) {
        $('#user-display').text(username);
    }

    // Using the new sidebar logout button
    $('#sidebar-logout').on('click', function() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('username');
        window.location.href = '/login.html';
    });

    $('.magic-bento-card').on('click', function() {
        const agentName = $(this).data('agent');
        const initialMessage = $(this).data('msg');
        
        // Store selected agent info to pass to chat view
        window.selectedAgent = { name: agentName, welcomeMsg: initialMessage };
        
        // Wait for ripple animation to finish before navigating
        setTimeout(() => {
            navigate('chat');
        }, 300);
    });

    // ==========================================
    // MAGIC BENTO ANIMATIONS (GSAP)
    // ==========================================
    const gridElement = document.getElementById('bento-grid');
    if (!gridElement || typeof gsap === 'undefined') return;

    const cards = document.querySelectorAll('.magic-bento-card');
    
    // 1. Global Spotlight Effect
    const spotlight = document.createElement('div');
    spotlight.className = 'global-spotlight';
    spotlight.style.cssText = `
      position: fixed;
      width: 800px; height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(132,0,255, 0.15) 0%, rgba(132,0,255, 0.08) 15%,
        rgba(132,0,255, 0.04) 25%, rgba(132,0,255, 0.02) 40%,
        rgba(132,0,255, 0.01) 65%, transparent 70%
      );
      z-index: 200;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `;
    document.body.appendChild(spotlight);

    const SPOTLIGHT_RADIUS = 400;
    const proximity = SPOTLIGHT_RADIUS * 0.5;
    const fadeDistance = SPOTLIGHT_RADIUS * 0.75;

    const handleMouseMove = (e) => {
        const rect = gridElement.getBoundingClientRect();
        const mouseInside = (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom);

        if (!mouseInside) {
            gsap.to(spotlight, { opacity: 0, duration: 0.3, ease: 'power2.out' });
            cards.forEach(card => card.style.setProperty('--glow-intensity', '0'));
            return;
        }

        let minDistance = Infinity;

        cards.forEach(card => {
            const cardRect = card.getBoundingClientRect();
            const centerX = cardRect.left + cardRect.width / 2;
            const centerY = cardRect.top + cardRect.height / 2;
            const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2;
            const effectiveDistance = Math.max(0, distance);

            minDistance = Math.min(minDistance, effectiveDistance);

            let glowIntensity = 0;
            if (effectiveDistance <= proximity) {
                glowIntensity = 1;
            } else if (effectiveDistance <= fadeDistance) {
                glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
            }

            // Update card glow properties for border mask
            const relativeX = ((e.clientX - cardRect.left) / cardRect.width) * 100;
            const relativeY = ((e.clientY - cardRect.top) / cardRect.height) * 100;
            
            card.style.setProperty('--glow-x', `${relativeX}%`);
            card.style.setProperty('--glow-y', `${relativeY}%`);
            card.style.setProperty('--glow-intensity', glowIntensity.toString());
            card.style.setProperty('--glow-radius', `${SPOTLIGHT_RADIUS}px`);
        });

        gsap.to(spotlight, { left: e.clientX, top: e.clientY, duration: 0.1, ease: 'power2.out' });

        const targetOpacity = minDistance <= proximity ? 0.8 : minDistance <= fadeDistance ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8 : 0;
        gsap.to(spotlight, { opacity: targetOpacity, duration: targetOpacity > 0 ? 0.2 : 0.5, ease: 'power2.out' });
    };

    const handleMouseLeave = () => {
        cards.forEach(card => card.style.setProperty('--glow-intensity', '0'));
        gsap.to(spotlight, { opacity: 0, duration: 0.3, ease: 'power2.out' });
    };

    document.addEventListener('mousemove', handleMouseMove);
    gridElement.addEventListener('mouseleave', handleMouseLeave);

    // 2. Card Specific Animations (Tilt, Magnetism, Particles, Ripple)
    cards.forEach(card => {
        let isHovered = false;
        let particles = [];
        let timeouts = [];
        
        // Use data-glow or default purple
        const glowColor = card.dataset.glow || '132, 0, 255';
        card.style.setProperty('--glow-color', glowColor);

        // Particle System
        const createParticle = (x, y) => {
            const el = document.createElement('div');
            el.className = 'particle';
            el.style.cssText = `
                position: absolute; width: 4px; height: 4px; border-radius: 50%;
                background: rgba(${glowColor}, 1); box-shadow: 0 0 6px rgba(${glowColor}, 0.6);
                pointer-events: none; z-index: 100; left: ${x}px; top: ${y}px;
            `;
            return el;
        };

        const clearParticles = () => {
            timeouts.forEach(clearTimeout);
            timeouts = [];
            particles.forEach(p => {
                gsap.to(p, { scale: 0, opacity: 0, duration: 0.3, ease: 'back.in(1.7)', onComplete: () => p.remove() });
            });
            particles = [];
        };

        const animateParticles = () => {
            const rect = card.getBoundingClientRect();
            for (let i = 0; i < 12; i++) { // 12 particles per card
                const timeoutId = setTimeout(() => {
                    if (!isHovered) return;
                    const p = createParticle(Math.random() * rect.width, Math.random() * rect.height);
                    card.appendChild(p);
                    particles.push(p);

                    gsap.fromTo(p, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });
                    gsap.to(p, { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100, rotation: Math.random() * 360, duration: 2 + Math.random() * 2, ease: 'none', repeat: -1, yoyo: true });
                    gsap.to(p, { opacity: 0.3, duration: 1.5, ease: 'power2.inOut', repeat: -1, yoyo: true });
                }, i * 100);
                timeouts.push(timeoutId);
            }
        };

        // Hover Event
        card.addEventListener('mouseenter', () => {
            isHovered = true;
            animateParticles();
            gsap.to(card, { rotateX: 5, rotateY: 5, duration: 0.3, ease: 'power2.out', transformPerspective: 1000 });
        });

        // Leave Event
        card.addEventListener('mouseleave', () => {
            isHovered = false;
            clearParticles();
            gsap.to(card, { rotateX: 0, rotateY: 0, x: 0, y: 0, duration: 0.3, ease: 'power2.out' });
        });

        // Mouse Move (Tilt + Magnetism)
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Tilt
            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;
            
            // Magnetism
            const magnetX = (x - centerX) * 0.05;
            const magnetY = (y - centerY) * 0.05;

            gsap.to(card, {
                rotateX, rotateY, x: magnetX, y: magnetY,
                duration: 0.1, ease: 'power2.out', transformPerspective: 1000
            });
        });

        // Click Ripple Effect
        card.addEventListener('click', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const maxDistance = Math.max(Math.hypot(x, y), Math.hypot(x - rect.width, y), Math.hypot(x, y - rect.height), Math.hypot(x - rect.width, y - rect.height));

            const ripple = document.createElement('div');
            ripple.style.cssText = `
                position: absolute; width: ${maxDistance * 2}px; height: ${maxDistance * 2}px; border-radius: 50%;
                background: radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, rgba(${glowColor}, 0.2) 30%, transparent 70%);
                left: ${x - maxDistance}px; top: ${y - maxDistance}px; pointer-events: none; z-index: 1000;
            `;
            card.appendChild(ripple);

            gsap.fromTo(ripple, { scale: 0, opacity: 1 }, { scale: 1, opacity: 0, duration: 0.8, ease: 'power2.out', onComplete: () => ripple.remove() });
        });
    });
});
