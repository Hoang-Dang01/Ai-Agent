/**
 * TargetCursor Component
 * Translated from React Bits to Vanilla JS + GSAP for Turing Drone V9.0
 */
class TargetCursor {
  constructor(options = {}) {
    this.targetSelector = options.targetSelector || '.cursor-target, button, a, input, select, .ultra-btn-icon, .btn-micro-add, .ultra-checkbox-label, .ultra-input, .btn-execute, .btn-secondary, .quick-link, .nav-item, .magnetic, .ultra-panel, .stat-box, .graph-box, .ultra-console';
    this.spinDuration = options.spinDuration || 2;
    this.hideDefaultCursor = options.hideDefaultCursor !== undefined ? options.hideDefaultCursor : true;
    this.hoverDuration = options.hoverDuration || 0.1;
    this.parallaxOn = options.parallaxOn !== undefined ? options.parallaxOn : false;
    
    this.constants = {
      borderWidth: 3,
      cornerSize: 12
    };

    this.isMobile = this.checkMobile();
    if (this.isMobile) return;

    this.activeTarget = null;
    this.isActive = false;
    this.activeStrengthObj = { current: 0 };
    this.targetCornerPositions = null;
    this.currentLeaveHandler = null;
    this.resumeTimeout = null;

    this.initDOM();
    this.initEvents();
  }

  checkMobile() {
    if (typeof window === 'undefined') return false;
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    return (hasTouchScreen && isSmallScreen) || mobileRegex.test(userAgent.toLowerCase());
  }

  initDOM() {
    // Inject CSS if not exists
    if (!document.getElementById('target-cursor-style')) {
      const link = document.createElement('link');
      link.id = 'target-cursor-style';
      link.rel = 'stylesheet';
      link.href = 'components/ui/target-cursor/target-cursor.css';
      document.head.appendChild(link);
    }

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'target-cursor-wrapper';
    
    this.dot = document.createElement('div');
    this.dot.className = 'target-cursor-dot';
    
    this.corners = [];
    const classes = ['corner-tl', 'corner-tr', 'corner-br', 'corner-bl'];
    classes.forEach(cls => {
      const corner = document.createElement('div');
      corner.className = `target-cursor-corner ${cls}`;
      this.corners.push(corner);
      this.wrapper.appendChild(corner);
    });
    
    this.wrapper.appendChild(this.dot);
    document.body.appendChild(this.wrapper);

    if (this.hideDefaultCursor) {
      document.body.style.cursor = 'none';
      const style = document.createElement('style');
      style.innerHTML = `* { cursor: none !important; }`;
      document.head.appendChild(style);
    }

    gsap.set(this.wrapper, {
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });

    this.createSpinTimeline();
  }

  createSpinTimeline() {
    if (this.spinTl) this.spinTl.kill();
    this.spinTl = gsap.timeline({ repeat: -1 })
      .to(this.wrapper, { rotation: '+=360', duration: this.spinDuration, ease: 'none' });
  }

  tickerFn = () => {
    if (!this.targetCornerPositions || !this.wrapper || !this.corners.length) return;

    const strength = this.activeStrengthObj.current;
    if (strength === 0) return;

    const cursorX = gsap.getProperty(this.wrapper, 'x');
    const cursorY = gsap.getProperty(this.wrapper, 'y');

    this.corners.forEach((corner, i) => {
      const currentX = gsap.getProperty(corner, 'x');
      const currentY = gsap.getProperty(corner, 'y');

      const targetX = this.targetCornerPositions[i].x - cursorX;
      const targetY = this.targetCornerPositions[i].y - cursorY;

      const finalX = currentX + (targetX - currentX) * strength;
      const finalY = currentY + (targetY - currentY) * strength;

      const duration = strength >= 0.99 ? (this.parallaxOn ? 0.2 : 0) : 0.05;

      gsap.to(corner, {
        x: finalX,
        y: finalY,
        duration: duration,
        ease: duration === 0 ? 'none' : 'power1.out',
        overwrite: 'auto'
      });
    });
  }

  moveCursor = (x, y) => {
    if (!this.wrapper) return;
    gsap.to(this.wrapper, { x, y, duration: 0.1, ease: 'power3.out' });
  }

  cleanupTarget(target) {
    if (this.currentLeaveHandler && target) {
      target.removeEventListener('mouseleave', this.currentLeaveHandler);
    }
    this.currentLeaveHandler = null;
  }

  initEvents() {
    gsap.ticker.add(this.tickerFn);

    window.addEventListener('mousemove', (e) => this.moveCursor(e.clientX, e.clientY));

    window.addEventListener('scroll', () => {
      if (!this.activeTarget || !this.wrapper) return;
      const mouseX = gsap.getProperty(this.wrapper, 'x');
      const mouseY = gsap.getProperty(this.wrapper, 'y');
      const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
      const isStillOverTarget = elementUnderMouse && (elementUnderMouse === this.activeTarget || elementUnderMouse.closest(this.targetSelector) === this.activeTarget);
      
      if (!isStillOverTarget && this.currentLeaveHandler) {
        this.currentLeaveHandler();
      }
    }, { passive: true });

    window.addEventListener('mousedown', () => {
      if (this.dot) gsap.to(this.dot, { scale: 0.7, duration: 0.3 });
      if (this.wrapper) gsap.to(this.wrapper, { scale: 0.9, duration: 0.2 });
    });

    window.addEventListener('mouseup', () => {
      if (this.dot) gsap.to(this.dot, { scale: 1, duration: 0.3 });
      if (this.wrapper) gsap.to(this.wrapper, { scale: 1, duration: 0.2 });
    });

    const enterHandler = (e) => {
      const directTarget = e.target;
      const target = directTarget.closest(this.targetSelector);
      
      if (!target || !this.wrapper || !this.corners.length) return;
      if (this.activeTarget === target) return;
      
      if (this.activeTarget) this.cleanupTarget(this.activeTarget);
      if (this.resumeTimeout) {
        clearTimeout(this.resumeTimeout);
        this.resumeTimeout = null;
      }

      this.activeTarget = target;
      this.corners.forEach(corner => gsap.killTweensOf(corner));

      gsap.killTweensOf(this.wrapper, 'rotation');
      if (this.spinTl) this.spinTl.pause();
      gsap.set(this.wrapper, { rotation: 0 });

      const rect = target.getBoundingClientRect();
      const { borderWidth, cornerSize } = this.constants;
      const cursorX = gsap.getProperty(this.wrapper, 'x');
      const cursorY = gsap.getProperty(this.wrapper, 'y');

      this.targetCornerPositions = [
        { x: rect.left - borderWidth, y: rect.top - borderWidth },
        { x: rect.right + borderWidth - cornerSize, y: rect.top - borderWidth },
        { x: rect.right + borderWidth - cornerSize, y: rect.bottom + borderWidth - cornerSize },
        { x: rect.left - borderWidth, y: rect.bottom + borderWidth - cornerSize }
      ];

      this.isActive = true;

      gsap.to(this.activeStrengthObj, {
        current: 1,
        duration: this.hoverDuration,
        ease: 'power2.out'
      });

      this.corners.forEach((corner, i) => {
        gsap.to(corner, {
          x: this.targetCornerPositions[i].x - cursorX,
          y: this.targetCornerPositions[i].y - cursorY,
          duration: 0.2,
          ease: 'power2.out'
        });
      });

      const leaveHandler = () => {
        this.isActive = false;
        this.targetCornerPositions = null;
        gsap.set(this.activeStrengthObj, { current: 0, overwrite: true });
        this.activeTarget = null;

        gsap.killTweensOf(this.corners);
        const positions = [
          { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
          { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
          { x: cornerSize * 0.5, y: cornerSize * 0.5 },
          { x: -cornerSize * 1.5, y: cornerSize * 0.5 }
        ];
        
        const tl = gsap.timeline();
        this.corners.forEach((corner, index) => {
          tl.to(corner, {
            x: positions[index].x,
            y: positions[index].y,
            duration: 0.3,
            ease: 'power3.out'
          }, 0);
        });

        this.resumeTimeout = setTimeout(() => {
          if (!this.activeTarget && this.wrapper && this.spinTl) {
            const currentRotation = gsap.getProperty(this.wrapper, 'rotation');
            const normalizedRotation = currentRotation % 360;
            this.spinTl.kill();
            this.spinTl = gsap.timeline({ repeat: -1 })
              .to(this.wrapper, { rotation: '+=360', duration: this.spinDuration, ease: 'none' });
            
            gsap.to(this.wrapper, {
              rotation: normalizedRotation + 360,
              duration: this.spinDuration * (1 - normalizedRotation / 360),
              ease: 'none',
              onComplete: () => {
                this.spinTl?.restart();
              }
            });
          }
          this.resumeTimeout = null;
        }, 50);

        this.cleanupTarget(target);
      };

      this.currentLeaveHandler = leaveHandler;
      target.addEventListener('mouseleave', leaveHandler);
    };

    window.addEventListener('mouseover', enterHandler, { passive: true });
  }
}

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', () => {
  window.targetCursorInstance = new TargetCursor();
});
