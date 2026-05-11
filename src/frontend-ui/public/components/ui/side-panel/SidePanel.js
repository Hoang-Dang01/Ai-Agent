/**
 * SidePanel Component (Right Drawer)
 * Automatically handles overlays, sliding animations, and shadow-safe hiding.
 */
var UISidePanel = (function () {
  function SidePanel(selectorOrElement) {
    this.panel = typeof selectorOrElement === 'string' 
      ? document.querySelector(selectorOrElement) 
      : selectorOrElement;
      
    if (!this.panel) return;

    this.panel.classList.add('ui-side-panel');
    
    // Ensure initial state is off-screen and display:none
    this.panel.style.display = 'none';
    this.panel.style.right = '-1000px';

    // Automatically find or create an overlay
    this.overlay = document.querySelector('.ui-side-panel-overlay');
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.className = 'ui-side-panel-overlay';
      document.body.appendChild(this.overlay);
    }

    var self = this;
    
    // Bind close buttons
    var closeBtns = this.panel.querySelectorAll('[data-dismiss="side-panel"]');
    closeBtns.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        self.hide();
      });
    });

    this.overlay.addEventListener('click', function() {
      self.hide();
    });
  }

  SidePanel.prototype.show = function() {
    var self = this;
    this.panel.style.display = 'flex';
    this.overlay.classList.add('show');
    // Tiny delay to allow display:flex to register before animation
    setTimeout(function() {
      self.panel.classList.add('show');
    }, 10);
  };

  SidePanel.prototype.hide = function() {
    var self = this;
    this.overlay.classList.remove('show');
    this.panel.classList.remove('show');
    // Wait for transition to finish before display:none
    setTimeout(function() {
      if (!self.panel.classList.contains('show')) {
        self.panel.style.display = 'none';
        self.panel.style.right = '-1000px';
      }
    }, 300);
  };

  return SidePanel;
})();
