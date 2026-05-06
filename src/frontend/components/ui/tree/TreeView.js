/**
 * TreeView Component
 * Hiển thị dạng hình cây thư mục (Dùng cho Phân Quyền, Danh mục nhóm)
 */
var UITreeView = (function () {

  /**
   * Đệ quy build node
   */
  function buildNodes(nodes) {
    var ul = document.createElement('ul');

    nodes.forEach(function(node) {
      var li = document.createElement('li');
      
      var nodeWrapper = document.createElement('div');
      nodeWrapper.className = 'ui-tree-node';

      var toggle = document.createElement('span');
      toggle.className = 'material-symbols-outlined ui-tree-toggle';
      if (node.children && node.children.length > 0) {
        toggle.innerText = 'chevron_right';
      } else {
        toggle.classList.add('empty');
      }

      var icon = document.createElement('span');
      icon.className = 'material-symbols-outlined ui-tree-icon';
      icon.innerText = node.icon || (node.children ? 'folder' : 'draft');

      var text = document.createElement('span');
      text.innerText = node.label;

      nodeWrapper.appendChild(toggle);
      nodeWrapper.appendChild(icon);
      nodeWrapper.appendChild(text);
      li.appendChild(nodeWrapper);

      if (node.children && node.children.length > 0) {
        var childUl = buildNodes(node.children);
        li.appendChild(childUl);

        // Click to toggle
        nodeWrapper.addEventListener('click', function() {
          childUl.classList.toggle('open');
          toggle.innerText = childUl.classList.contains('open') ? 'expand_more' : 'chevron_right';
          icon.innerText = childUl.classList.contains('open') ? 'folder_open' : 'folder';
        });
      }

      ul.appendChild(li);
    });

    return ul;
  }

  /**
   * Tạo Tree
   * @param {Array} data - Data dạng Node: [{ label, icon, children: [...] }]
   */
  function create(data) {
    var wrapper = document.createElement('div');
    wrapper.className = 'ui-tree';
    
    var rootUl = buildNodes(data);
    rootUl.style.display = 'block'; // Root luôn mở
    rootUl.style.paddingLeft = '0'; // Xoá padding thừa của root
    wrapper.appendChild(rootUl);

    return wrapper;
  }

  return {
    create: create
  };
})();
