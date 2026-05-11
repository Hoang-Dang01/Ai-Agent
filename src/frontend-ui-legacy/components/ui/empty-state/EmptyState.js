/**
 * EmptyState Component
 * Trạng thái trống (VD: Chưa có khách hàng, chưa có hợp đồng)
 */
var UIEmptyState = (function () {

  /**
   * Tạo màn hình rỗng
   * @param {Object} config - { icon, title, desc, action (DOM Node) }
   */
  function create(config) {
    var wrapper = document.createElement('div');
    wrapper.className = 'ui-empty-state';

    var iconSpan = document.createElement('span');
    iconSpan.className = 'material-symbols-outlined ui-empty-icon';
    iconSpan.innerText = config.icon || 'inbox';
    wrapper.appendChild(iconSpan);

    var titleDiv = document.createElement('div');
    titleDiv.className = 'ui-empty-title';
    titleDiv.innerText = config.title || 'Không có dữ liệu';
    wrapper.appendChild(titleDiv);

    if (config.desc) {
      var descDiv = document.createElement('div');
      descDiv.className = 'ui-empty-desc';
      descDiv.innerText = config.desc;
      wrapper.appendChild(descDiv);
    }

    if (config.action instanceof Node) {
      wrapper.appendChild(config.action);
    }

    return wrapper;
  }

  return {
    create: create
  };
})();
