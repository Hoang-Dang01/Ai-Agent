/**
 * Action Toolbar Component
 * Thanh công cụ chuẩn 6 nút: Thêm, Sửa, Xóa, Lọc, In, Đóng theo REQUIREMENT.md
 */
var UIActionToolbar = (function () {

  /**
   * Sinh thanh Toolbar nghiệp vụ
   * @param {Object} actions - { onAdd, onEdit, onDelete, onFilter, onPrint, onClose }
   */
  function create(actions) {
    actions = actions || {};
    
    return UIButton.createBar([
      { text: 'Thêm', icon: 'add', type: 'tool', onClick: actions.onAdd },
      { text: 'Sửa', icon: 'edit', type: 'tool', onClick: actions.onEdit },
      { text: 'Xóa', icon: 'delete', type: 'tool', onClick: actions.onDelete },
      { text: 'Lọc', icon: 'filter_alt', type: 'tool', onClick: actions.onFilter },
      { text: 'In', icon: 'print', type: 'tool', onClick: actions.onPrint },
      { text: 'Đóng', icon: 'close', type: 'tool', onClick: actions.onClose }
    ]);
  }

  return {
    create: create
  };
})();
