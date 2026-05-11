/**
 * UINestedTabs — Tab phân cấp 2 cấp (Cha → Con) + Kéo thả sắp xếp
 * ──────────────────────────────────────────────────────────────────
 * Nhận vào một mảng flat từ DB (giống WA_Menu):
 *   [{ id, parent, label, [icon], [formName] }]
 *
 * Quy tắc xác định cha/con:
 *   - parent === '' hoặc null/undefined → Tab CHA (root)
 *   - parent !== ''                     → Tab CON (thuộc parent đó)
 *
 * API:
 *   UINestedTabs.create(records, options?) → DOM Element
 *   UINestedTabs.createFromDB(dbRows, options?) → DOM Element
 *
 * Options:
 *   onTabChange(parentId, childId)            - callback khi đổi tab
 *   onReorder(type, orderedIds, parentId?)    - callback khi kéo thả xong
 *                                               type = 'parent' | 'child'
 *   renderContent(item)                       - trả về Node | string cho panel
 *   defaultParentId                           - tab cha active ban đầu
 *   defaultChildId                            - tab con active ban đầu
 *   draggable                                 - true (mặc định) để bật kéo thả
 */
var UINestedTabs = (function () {

  // ════════════════════════════════════════════════════════════
  //  PUBLIC: create
  // ════════════════════════════════════════════════════════════
  function create(records, options) {
    options = options || {};
    var isDraggable = options.draggable !== false; // bật mặc định

    // ── 1. Phân loại cha / con ──────────────────────────────────
    var parents = records.filter(function (r) {
      return !r.parent || r.parent.trim() === '';
    });

    var childrenMap = {}; // { parentId: [child, ...] }
    records.forEach(function (r) {
      if (r.parent && r.parent.trim() !== '') {
        if (!childrenMap[r.parent]) childrenMap[r.parent] = [];
        childrenMap[r.parent].push(r);
      }
    });

    if (parents.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'ui-nested-tabs-empty';
      empty.textContent = 'Không có dữ liệu Tab';
      return empty;
    }

    // ── Phân nhánh: Vertical vs Horizontal ──────────────────
    if (options.vertical) {
      return _createVertical(parents, childrenMap, options);
    }

    // ── 2. Active mặc định ──────────────────────────────────────
    var defaultParentId = options.defaultParentId || parents[0].id;
    var activeParent    = parents.find(function (p) { return p.id === defaultParentId; }) || parents[0];

    // ── 3. Wrapper ───────────────────────────────────────────────
    var wrapper = document.createElement('div');
    wrapper.className = 'ui-nested-tabs';

    // ── 4. Parent Tab Bar ────────────────────────────────────────
    var parentBar = document.createElement('div');
    parentBar.className = 'ui-nested-tabs__parent-bar';

    // ── 5. Child Area ────────────────────────────────────────────
    var childArea = document.createElement('div');
    childArea.className = 'ui-nested-tabs__child-area';

    // ── 6. Render mỗi parent ────────────────────────────────────
    parents.forEach(function (parentItem) {
      var isParentActive = (parentItem.id === activeParent.id);
      var children       = childrenMap[parentItem.id] || [];

      // ─ Parent button ─
      var pBtn = _buildParentBtn(parentItem, isParentActive, children.length, isDraggable);
      parentBar.appendChild(pBtn);

      // ─ Child section ─
      var childSection = document.createElement('div');
      childSection.className = 'ui-nested-tabs__section' + (isParentActive ? ' active' : '');
      childSection.dataset.sectionId = parentItem.id;

      if (children.length > 0) {
        var defaultChildId  = isParentActive ? (options.defaultChildId || children[0].id) : children[0].id;

        var childBar        = document.createElement('div');
        childBar.className  = 'ui-nested-tabs__child-bar';

        var panelArea       = document.createElement('div');
        panelArea.className = 'ui-nested-tabs__panel-area';

        children.forEach(function (childItem) {
          var isChildActive = (childItem.id === defaultChildId);

          // Child btn
          var cBtn = _buildChildBtn(childItem, parentItem, isChildActive, isDraggable);
          childBar.appendChild(cBtn);

          // Panel
          var panel = _buildPanel(childItem, parentItem, isChildActive, options);
          panelArea.appendChild(panel);

          // Click: activate child tab
          cBtn.addEventListener('click', function () {
            _activateChildTab(childBar, panelArea, cBtn, panel);
            if (typeof options.onTabChange === 'function') {
              options.onTabChange(parentItem.id, childItem.id);
            }
          });
        });

        // Drag-and-drop cho child bar
        if (isDraggable) {
          _attachDragToBar(childBar, panelArea, 'child', parentItem.id, options);
        }

        childSection.appendChild(childBar);
        childSection.appendChild(panelArea);

      } else {
        // Không có con → panel trực tiếp
        var soloPanel = _buildPanel(parentItem, null, true, options);
        childSection.appendChild(soloPanel);
      }

      childArea.appendChild(childSection);

      // Click: activate parent tab
      pBtn.addEventListener('click', function () {
        _activateParentTab(parentBar, childArea, pBtn, childSection);
        if (typeof options.onTabChange === 'function') {
          var activeChild = childSection.querySelector('.ui-nested-tab-child-btn.active');
          options.onTabChange(parentItem.id, activeChild ? activeChild.dataset.childId : null);
        }
      });
    });

    // Drag-and-drop cho parent bar
    if (isDraggable) {
      _attachDragToBar(parentBar, null, 'parent', null, options);
    }

    wrapper.appendChild(parentBar);
    wrapper.appendChild(childArea);
    return wrapper;
  }

  // ════════════════════════════════════════════════════════════
  //  PUBLIC: createFromDB
  // ════════════════════════════════════════════════════════════
  function createFromDB(dbRows, options) {
    var records = (dbRows || []).map(function (row) {
      return {
        id:       row.MenuID   || row.id       || row.menuId,
        parent:   row.Parent   || row.parent   || row.parentId || '',
        label:    row.VN       || row.label    || row.name || row.Label || '(Không tên)',
        labelEN:  row.EN       || row.en       || '',
        icon:     row.IconClass || row.icon    || '',
        formName: row.FormName  || row.formName || ''
      };
    });
    return create(records, options);
  }

  // ════════════════════════════════════════════════════════════
  //  PRIVATE: builders
  // ════════════════════════════════════════════════════════════

  function _buildParentBtn(item, isActive, childCount, isDraggable) {
    var btn = document.createElement('button');
    btn.className = 'ui-nested-tab-parent-btn' + (isActive ? ' active' : '');
    btn.dataset.parentId = item.id;

    // Drag handle icon (chỉ hiện khi hover nhờ CSS)
    if (isDraggable) {
      var handle = UIIcon.create('drag_indicator', 'ui-nested-drag-handle');
      btn.appendChild(handle);
      btn.draggable = true;
      btn.dataset.dragType = 'parent';
    }

    if (item.icon) {
      var iconEl = UIIcon.create(item.icon);
      if (iconEl) { iconEl.style.fontSize = '18px'; btn.appendChild(iconEl); }
    }

    var labelSpan = document.createElement('span');
    labelSpan.textContent = item.label || item.id;
    btn.appendChild(labelSpan);

    if (childCount > 0) {
      var badge = document.createElement('span');
      badge.className = 'ui-nested-tab-badge';
      badge.textContent = childCount;
      btn.appendChild(badge);
    }

    return btn;
  }

  function _buildChildBtn(childItem, parentItem, isActive, isDraggable) {
    var btn = document.createElement('button');
    btn.className = 'ui-nested-tab-child-btn' + (isActive ? ' active' : '');
    btn.dataset.childId  = childItem.id;
    btn.dataset.parentId = parentItem.id;

    if (isDraggable) {
      var handle = UIIcon.create('drag_indicator', 'ui-nested-drag-handle ui-nested-drag-handle--child');
      btn.appendChild(handle);

      btn.draggable = true;
      btn.dataset.dragType = 'child';
    }

    var labelSpan = document.createElement('span');
    labelSpan.textContent = childItem.label || childItem.id;
    btn.appendChild(labelSpan);

    return btn;
  }

  function _buildPanel(item, parentItem, isActive, options) {
    var panel = document.createElement('div');
    panel.className = 'ui-nested-tab-panel' + (isActive ? ' active' : '');
    panel.id = 'nested-panel-' + item.id;

    if (typeof options.renderContent === 'function') {
      var content = options.renderContent(item);
      if (typeof content === 'string') {
        panel.innerHTML = content;
      } else if (content instanceof Node) {
        panel.appendChild(content);
      }
    } else {
      panel.innerHTML = _defaultPanelHTML(item, parentItem);
    }

    return panel;
  }

  // ════════════════════════════════════════════════════════════
  //  PRIVATE: activate helpers
  // ════════════════════════════════════════════════════════════

  function _activateParentTab(parentBar, childArea, activeBtn, activeSection) {
    parentBar.querySelectorAll('.ui-nested-tab-parent-btn').forEach(function (b) {
      b.classList.remove('active');
    });
    childArea.querySelectorAll('.ui-nested-tabs__section').forEach(function (s) {
      s.classList.remove('active');
    });
    activeBtn.classList.add('active');
    activeSection.classList.add('active');
  }

  function _activateChildTab(childBar, panelArea, activeBtn, activePanel) {
    childBar.querySelectorAll('.ui-nested-tab-child-btn').forEach(function (b) {
      b.classList.remove('active');
    });
    panelArea.querySelectorAll('.ui-nested-tab-panel').forEach(function (p) {
      p.classList.remove('active');
    });
    activeBtn.classList.add('active');
    activePanel.classList.add('active');
  }

  // ════════════════════════════════════════════════════════════
  //  PRIVATE: Drag-and-drop
  // ════════════════════════════════════════════════════════════

  /**
   * Gắn drag-and-drop vào một tab bar (parent hoặc child)
   * @param {Element} bar          - thanh tab chứa các btn có thể kéo
   * @param {Element|null} panelArea - vùng panel tương ứng (dùng để sync thứ tự panel)
   * @param {string}  type         - 'parent' | 'child'
   * @param {string|null} parentId - id của tab cha (chỉ dùng khi type='child')
   * @param {Object}  options      - options của component
   */
  function _attachDragToBar(bar, panelArea, type, parentId, options) {
    var dragging    = null;  // phần tử đang kéo
    var placeholder = null;  // dải chỉ vị trí thả

    // Selector của các btn trong bar
    var btnSelector = (type === 'parent')
      ? '.ui-nested-tab-parent-btn'
      : '.ui-nested-tab-child-btn';

    // ── dragstart ──
    bar.addEventListener('dragstart', function (e) {
      var btn = e.target.closest(btnSelector);
      if (!btn) return;

      dragging = btn;
      dragging.classList.add('ui-nested-dragging');

      // Tạo ghost image sạch
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', btn.dataset.parentId || btn.dataset.childId || '');

      // Tạo placeholder
      placeholder = document.createElement('div');
      placeholder.className = 'ui-nested-drop-placeholder';
      if (type === 'child') placeholder.classList.add('ui-nested-drop-placeholder--child');
    });

    // ── dragover ──
    bar.addEventListener('dragover', function (e) {
      if (!dragging) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      var target = e.target.closest(btnSelector);
      if (!target || target === dragging) {
        return;
      }

      // Xác định thả vào trước hay sau
      var rect   = target.getBoundingClientRect();
      var offset = (type === 'parent')
        ? e.clientX - rect.left    // ngang
        : e.clientX - rect.left;   // ngang (child bar cũng ngang)
      var half = (type === 'parent') ? rect.width / 2 : rect.width / 2;

      // Xóa placeholder cũ nếu có
      if (placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);

      if (offset < half) {
        bar.insertBefore(placeholder, target);
      } else {
        var next = target.nextSibling;
        if (next) bar.insertBefore(placeholder, next);
        else bar.appendChild(placeholder);
      }
    });

    // ── dragleave ──
    bar.addEventListener('dragleave', function (e) {
      // Chỉ xóa placeholder khi ra ngoài bar
      if (!bar.contains(e.relatedTarget) && placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
      }
    });

    // ── drop ──
    bar.addEventListener('drop', function (e) {
      e.preventDefault();
      if (!dragging || !placeholder || !placeholder.parentNode) return;

      // Đặt btn vào vị trí placeholder
      bar.insertBefore(dragging, placeholder);
      placeholder.parentNode.removeChild(placeholder);

      // Sync thứ tự panel nếu là child bar
      if (panelArea) {
        _syncPanelOrder(bar, panelArea, btnSelector);
      }

      // Gọi onReorder callback
      if (typeof options.onReorder === 'function') {
        var orderedIds = Array.from(bar.querySelectorAll(btnSelector)).map(function (b) {
          return type === 'parent' ? b.dataset.parentId : b.dataset.childId;
        });
        options.onReorder(type, orderedIds, parentId);
      }

      _cleanup();
    });

    // ── dragend ──
    bar.addEventListener('dragend', function () {
      _cleanup();
    });

    // ─ cleanup local state ─
    function _cleanup() {
      if (dragging) {
        dragging.classList.remove('ui-nested-dragging');
        dragging = null;
      }
      if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
      }
      placeholder = null;
    }
  }

  /**
   * Sau khi kéo thả child btn, sắp xếp lại các panel theo thứ tự btn mới
   */
  function _syncPanelOrder(childBar, panelArea, btnSelector) {
    var btns = Array.from(childBar.querySelectorAll(btnSelector));
    btns.forEach(function (btn) {
      var childId = btn.dataset.childId;
      var panel   = panelArea.querySelector('#nested-panel-' + childId);
      if (panel) panelArea.appendChild(panel); // appendChild tự move về cuối → đúng thứ tự
    });
  }

  // ════════════════════════════════════════════════════════════
  //  PRIVATE: default panel content
  // ════════════════════════════════════════════════════════════

  function _defaultPanelHTML(item, parentItem) {
    return [
      '<div class="ui-nested-tab-default-content">',
        UIIcon.renderHtml(item.icon || 'folder_open', 'font-size:40px;opacity:0.2;display:block;margin-bottom:12px'),
        '<div style="font-weight:600;font-size:15px;margin-bottom:6px">', item.label || item.id, '</div>',
        parentItem
          ? '<div style="font-size:12px;opacity:0.5">Thuộc nhóm: ' + parentItem.label + ' (' + parentItem.id + ')</div>'
          : '',
        item.formName
          ? '<code style="font-size:11px;opacity:0.5;display:block;margin-top:8px">' + item.formName + '</code>'
          : '',
      '</div>'
    ].join('');
  }

  // ════════════════════════════════════════════════════════════
  //  PRIVATE: Vertical layout
  // ════════════════════════════════════════════════════════════

  function _createVertical(parents, childrenMap, options) {
    var isDraggable = options.draggable !== false;

    var defaultParentId = options.defaultParentId || parents[0].id;
    var activeParent    = parents.find(function (p) { return p.id === defaultParentId; }) || parents[0];
    var defaultChildId  = options.defaultChildId  || null;

    var initChildren = childrenMap[activeParent.id] || [];
    var activeChildId = defaultChildId || (initChildren.length > 0 ? initChildren[0].id : null);

    var allContentPanels = [];
    var allSidebarBtns = [];

    var wrapper = document.createElement('div');
    wrapper.className = 'ui-nested-tabs ui-nested-tabs--vertical';

    var sidebar = document.createElement('div');
    sidebar.className = 'ui-nested-tabs__sidebar';

    var contentArea = document.createElement('div');
    contentArea.className = 'ui-nested-tabs__vertical-content';

    function _buildSidebarNode(node, level, isNodeActive, shouldOpen) {
      var children = childrenMap[node.id] || [];
      var isRoot = level === 0;

      var parentGroup = document.createElement('div');
      parentGroup.className = 'ui-nested-tabs__sidebar-parent level-' + level;
      if (isDraggable) {
        parentGroup.draggable = true;
        parentGroup.dataset.dragParentId = node.id;
      }

      var pBtn = document.createElement('button');
      pBtn.className = (isRoot ? 'ui-nested-tab-parent-btn--v' : 'ui-nested-tab-child-btn--v') + (isNodeActive ? ' active' : '');
      pBtn.dataset.nodeId = node.id;
      pBtn.dataset.parentId = node.parent || '';
      if (!isRoot) {
          pBtn.dataset.childId = node.id; 
      }
      
      if (level > 0) {
        pBtn.style.paddingLeft = (16 + level * 20) + 'px';
      }

      if (isDraggable) {
        var handle = UIIcon.create('drag_indicator', 'ui-nested-drag-handle' + (isRoot ? '' : ' ui-nested-drag-handle--child'));
        pBtn.appendChild(handle);
        if (!isRoot) {
            pBtn.draggable = true;
            pBtn.dataset.dragType = 'child';
        }
      }

      var iconWrap = document.createElement('div');
      iconWrap.style.cssText = 'width: 20px; display: flex; justify-content: center; align-items: center; flex-shrink: 0;';
      if (!isRoot) iconWrap.style.marginRight = '8px';

      var actualIcon = node.icon;
      if (!actualIcon || actualIcon.indexOf('icon-') === 0) actualIcon = (isRoot ? 'folder_open' : 'horizontal_rule');

      var iconEl = UIIcon.create(actualIcon);
      if (iconEl) {
        iconEl.style.fontSize = isRoot ? '18px' : '16px';
        if (!node.icon || node.icon.indexOf('icon-') === 0) {
          iconEl.style.opacity = '0.3';
        }
        iconWrap.appendChild(iconEl);
      }
      pBtn.appendChild(iconWrap);

      var lbl = document.createElement('span');
      lbl.style.cssText = 'flex:1;overflow:hidden;text-overflow:ellipsis;';
      lbl.textContent = node.label || node.id;
      pBtn.appendChild(lbl);

      if (children.length > 0) {
        var badge = document.createElement('span');
        badge.className = 'ui-nested-tab-badge';
        badge.style.cssText = 'min-width:18px;height:18px;font-size:10px; margin-right: 4px;';
        badge.textContent = children.length;
        pBtn.appendChild(badge);

        var chevron = UIIcon.create('expand_more', 'ui-nested-parent-chevron');
        pBtn.appendChild(chevron);
      }

      parentGroup.appendChild(pBtn);
      allSidebarBtns.push(pBtn);

      var childList = null;
      if (children.length > 0) {
        childList = document.createElement('div');
        childList.className = 'ui-nested-tabs__child-list' + (shouldOpen ? ' open' : '');

        children.forEach(function (childItem) {
           var childIsActive = isNodeActive && (childItem.id === activeChildId);
           var childShouldOpen = childIsActive;
           var cRes = _buildSidebarNode(childItem, level + 1, childIsActive, childShouldOpen);
           childList.appendChild(cRes.group);
        });

        parentGroup.appendChild(childList);

        if (isDraggable) {
          _attachVerticalDrag(childList, contentArea, node.id, options);
        }
      }

      var parentPanel = document.createElement('div');
      parentPanel.className = 'ui-nested-tab-panel--v' + (isNodeActive && (!activeChildId || activeChildId === '') ? ' active' : '');
      parentPanel.id = 'nested-panel-' + node.id;
      if (typeof options.renderContent === 'function') {
        var sc = options.renderContent(node);
        if (typeof sc === 'string') { parentPanel.innerHTML = sc; }
        else if (sc instanceof Node) { parentPanel.appendChild(sc); }
      } else { parentPanel.innerHTML = _defaultPanelHTML(node, null); }
      contentArea.appendChild(parentPanel);
      allContentPanels.push(parentPanel);

      pBtn.addEventListener('click', function (e) {
        e.stopPropagation();

        var isPanelActive = parentPanel.classList.contains('active');

        allSidebarBtns.forEach(function(b) { b.classList.remove('active'); });
        allContentPanels.forEach(function(p) { p.classList.remove('active'); });

        pBtn.classList.add('active');

        if (!isPanelActive) {
          parentPanel.classList.add('active');
          if (childList) childList.classList.add('open');
          
          var curr = parentGroup.parentElement;
          while(curr && curr.classList.contains('ui-nested-tabs__child-list')) {
            curr.classList.add('open');
            curr = curr.parentElement.parentElement;
          }

          if (typeof options.onTabChange === 'function') {
            options.onTabChange(node.id, null);
          }
        } else {
          parentPanel.classList.add('active');
          if (childList) {
            childList.classList.toggle('open');
          }
        }
      });

      return { group: parentGroup };
    }

    parents.forEach(function (parentItem) {
      var isParentActive = (parentItem.id === activeParent.id);
      var res = _buildSidebarNode(parentItem, 0, isParentActive, isParentActive);
      sidebar.appendChild(res.group);
    });

    if (isDraggable) {
      // NOTE: attach to sidebar directly
      _attachVerticalDragParent(sidebar, options);
    }

    var resizer = document.createElement('div');
    resizer.className = 'ui-nested-resizer';
    sidebar.appendChild(resizer);
    _initSidebarResizer(resizer, sidebar);

    wrapper.appendChild(sidebar);
    wrapper.appendChild(contentArea);
    return wrapper;
  }

  /**
   * Khởi tạo tính năng kéo giãn sidebar
   */
  function _initSidebarResizer(resizer, sidebar) {
    var isResizing = false;

    resizer.addEventListener('mousedown', function (e) {
      isResizing = true;
      resizer.classList.add('is-resizing');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      var onMouseMove = function (e) {
        if (!isResizing) return;
        
        // Tính toán độ rộng mới dựa trên vị trí chuột
        var containerRect = sidebar.parentElement.getBoundingClientRect();
        var newWidth = e.clientX - containerRect.left;
        
        // Giới hạn width từ 180px đến 600px
        if (newWidth < 180) newWidth = 180;
        if (newWidth > 600) newWidth = 600;
        
        sidebar.style.width = newWidth + 'px';
      };

      var onMouseUp = function () {
        isResizing = false;
        resizer.classList.remove('is-resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  }

  // ── Drag dọc cho child list ──────────────────────────────
  function _attachVerticalDrag(childList, contentArea, parentId, options) {
    var dragging    = null;
    var placeholder = null;

    childList.addEventListener('dragstart', function (e) {
      var grp = e.target.closest('.ui-nested-tabs__sidebar-parent');
      if (!grp || grp.parentElement !== childList) return;
      dragging = grp;
      dragging.classList.add('ui-nested-dragging');
      e.dataTransfer.effectAllowed = 'move';
      placeholder = document.createElement('div');
      placeholder.className = 'ui-nested-drop-placeholder--v';
      e.stopPropagation();
    });

    childList.addEventListener('dragover', function (e) {
      if (!dragging) return;
      e.preventDefault();
      var target = e.target.closest('.ui-nested-tabs__sidebar-parent');
      if (!target || target === dragging || target.parentElement !== childList) return;
      if (placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
      var rect   = target.getBoundingClientRect();
      var isUpper = (e.clientY - rect.top) < rect.height / 2;
      if (isUpper) childList.insertBefore(placeholder, target);
      else { var nx = target.nextSibling; if (nx) childList.insertBefore(placeholder, nx); else childList.appendChild(placeholder); }
    });

    childList.addEventListener('dragleave', function (e) {
      if (!childList.contains(e.relatedTarget) && placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
      }
    });

    childList.addEventListener('drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (!dragging || !placeholder || !placeholder.parentNode) return;
      childList.insertBefore(dragging, placeholder);
      placeholder.parentNode.removeChild(placeholder);
      
      // Sync panel order for UI (if needed, but panels are all flat in contentArea)
      // Array.from(childList.children).forEach(...) is possible, but contentArea order doesn't break CSS rendering.
      
      if (typeof options.onReorder === 'function') {
        var ids = Array.from(childList.querySelectorAll(':scope > .ui-nested-tabs__sidebar-parent > .ui-nested-tab-child-btn--v')).map(function (b) { return b.dataset.childId || b.dataset.nodeId; });
        options.onReorder('child', ids, parentId);
      }
      _vCleanup();
    });

    childList.addEventListener('dragend', function(e) { e.stopPropagation(); _vCleanup(); });

    function _vCleanup() {
      if (dragging) { dragging.classList.remove('ui-nested-dragging'); dragging = null; }
      if (placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
      placeholder = null;
    }
  }

  // ── Drag dọc cho parent groups ───────────────────────────
  function _attachVerticalDragParent(sidebar, options) {
    var dragging    = null;
    var placeholder = null;

    sidebar.addEventListener('dragstart', function (e) {
      var grp = e.target.closest('.ui-nested-tabs__sidebar-parent');
      if (!grp || grp.parentElement !== sidebar) return;
      dragging = grp;
      dragging.classList.add('ui-nested-dragging');
      e.dataTransfer.effectAllowed = 'move';
      placeholder = document.createElement('div');
      placeholder.className = 'ui-nested-drop-placeholder--v';
      placeholder.style.margin = '2px 0';
      e.stopPropagation();
    });

    sidebar.addEventListener('dragover', function (e) {
      if (!dragging) return;
      e.preventDefault();
      var target = e.target.closest('.ui-nested-tabs__sidebar-parent');
      if (!target || target === dragging || target.parentElement !== sidebar) return;
      if (placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
      var rect   = target.getBoundingClientRect();
      var isUpper = (e.clientY - rect.top) < rect.height / 2;
      if (isUpper) sidebar.insertBefore(placeholder, target);
      else { var nx = target.nextSibling; if (nx) sidebar.insertBefore(placeholder, nx); else sidebar.appendChild(placeholder); }
    });

    sidebar.addEventListener('dragleave', function (e) {
      if (!sidebar.contains(e.relatedTarget) && placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
      }
    });

    sidebar.addEventListener('drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (!dragging || !placeholder || !placeholder.parentNode) return;
      sidebar.insertBefore(dragging, placeholder);
      placeholder.parentNode.removeChild(placeholder);
      if (typeof options.onReorder === 'function') {
        var ids = Array.from(sidebar.querySelectorAll(':scope > .ui-nested-tabs__sidebar-parent > .ui-nested-tab-parent-btn--v')).map(function (b) {
          return b.dataset.parentId || b.dataset.nodeId;
        });
        options.onReorder('parent', ids, null);
      }
      _vpCleanup();
    });

    sidebar.addEventListener('dragend', function(e) { e.stopPropagation(); _vpCleanup(); });

    function _vpCleanup() {
      if (dragging) { dragging.classList.remove('ui-nested-dragging'); dragging = null; }
      if (placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
      placeholder = null;
    }
  }

  // ════════════════════════════════════════════════════════════
  //  EXPORTS
  // ════════════════════════════════════════════════════════════
  return {
    create:       create,
    createFromDB: createFromDB
  };

})();
