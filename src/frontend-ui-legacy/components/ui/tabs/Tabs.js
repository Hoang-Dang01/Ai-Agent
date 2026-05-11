/**
 * Tabs Component
 * Quản lý chuyển đổi các Tab (Ví dụ: Tab Bàn tiệc, Tab Khác...)
 */
var UITabs = (function () {

  /**
   * Tạo bộ Tabs
   * @param {Array} tabsConfig - [{ id, title, content (DOM) }]
   */
  function create(tabsConfig) {
    var wrapper = document.createElement('div');
    wrapper.className = 'ui-tabs';

    var header = document.createElement('div');
    header.className = 'ui-tabs-header';

    var body = document.createElement('div');
    body.className = 'ui-tabs-body';

    tabsConfig.forEach(function(tab, index) {
      // Header Button
      var btn = document.createElement('button');
      btn.className = 'ui-tab-btn' + (index === 0 ? ' active' : '');
      btn.innerText = tab.title;
      btn.dataset.target = tab.id;
      header.appendChild(btn);

      // Panel Body
      var panel = document.createElement('div');
      panel.className = 'ui-tab-panel' + (index === 0 ? ' active' : '');
      panel.id = 'panel-' + tab.id;
      
      if (typeof tab.content === 'string') {
        panel.innerHTML = tab.content;
      } else if (tab.content instanceof Node) {
        panel.appendChild(tab.content);
      }
      
      body.appendChild(panel);

      // Event listener
      btn.addEventListener('click', function() {
        // Gỡ active toàn bộ
        var allBtns = header.querySelectorAll('.ui-tab-btn');
        var allPanels = body.querySelectorAll('.ui-tab-panel');
        
        allBtns.forEach(b => b.classList.remove('active'));
        allPanels.forEach(p => p.classList.remove('active'));

        // Set active cho nút được bấm
        btn.classList.add('active');
        panel.classList.add('active');
      });
    });

    wrapper.appendChild(header);
    wrapper.appendChild(body);

    return wrapper;
  }

  return {
    create: create
  };
})();
