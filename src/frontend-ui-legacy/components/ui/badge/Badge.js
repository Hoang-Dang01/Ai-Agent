/**
 * Badge Component
 * Sinh ra các nhãn trạng thái (Ví dụ: Đã Thanh Toán, Còn trống, Hủy)
 */
var UIBadge = (function () {

  /**
   * Sinh Badge
   * @param {string} text - Nội dung hiển thị
   * @param {string} type - success | danger | warning | primary
   */
  function create(text, type) {
    var badge = document.createElement('span');
    badge.className = 'status-badge ' + (type || 'primary');
    badge.innerText = text;
    return badge;
  }

  return {
    create: create
  };
})();
