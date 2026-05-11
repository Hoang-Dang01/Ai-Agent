/**
 * Data ComboBox Component
 */
var UIControls = window.UIControls || {};

UIControls.createDataComboBox = function(options) {
  var container = document.createElement('div');
  container.className = 'combo-box-container';
  
  // Input
  var input = document.createElement('input');
  input.type = 'text';
  input.className = 'ui-input';
  input.placeholder = options.placeholder || '';
  if (options.id) input.id = options.id;

  // Actions block
  var actions = document.createElement('div');
  actions.className = 'combo-box-actions';

  var btnArrow = document.createElement('button');
  btnArrow.className = 'combo-action-btn';
  btnArrow.innerHTML = '<span class="material-symbols-outlined">arrow_drop_down</span>';
  btnArrow.title = 'Mở danh sách (F4)';

  var btnLookup = document.createElement('button');
  btnLookup.className = 'combo-action-btn';
  btnLookup.innerHTML = '<span class="material-symbols-outlined">more_horiz</span>';
  btnLookup.title = 'Tra cứu (F3)';

  var btnAdd = document.createElement('button');
  btnAdd.className = 'combo-action-btn';
  btnAdd.innerHTML = '<span class="material-symbols-outlined">note_add</span>';
  btnAdd.title = 'Thêm mới (F2)';

  actions.appendChild(btnArrow);
  actions.appendChild(btnLookup);
  actions.appendChild(btnAdd);

  // Dropdown Panel
  var dropdown = document.createElement('div');
  dropdown.className = 'data-dropdown-menu';
  
  var fullData = options.data || [];
  
  function renderTable(displayData) {
    if (UIControls.utils) {
      dropdown.innerHTML = UIControls.utils.createDropdownTableHTML(options.headers || [], displayData, options.colHighlightIndex || 0);
      var rows = dropdown.querySelectorAll('tbody tr');
      rows.forEach(row => {
        row.addEventListener('click', function() {
          var dataRow = displayData[row.getAttribute('data-index')];
          input.value = dataRow[options.colFilterIndex || 0];
          hideDropdown();
          if(typeof options.onSelect === 'function') {
            options.onSelect(dataRow);
          }
        });
      });
    }
  }

  function showDropdown() {
    if (dropdown.parentNode !== document.body) {
      document.body.appendChild(dropdown);
    }
    renderTable(fullData);
    if (UIControls.utils) {
      UIControls.utils.computeDropdownPosition(container, dropdown);
    }
    dropdown.classList.add('active');
  }

  function hideDropdown() {
    dropdown.classList.remove('active');
    if (dropdown.parentNode) dropdown.parentNode.removeChild(dropdown);
  }

  btnArrow.addEventListener('click', function(e) {
    e.preventDefault();
    dropdown.classList.contains('active') ? hideDropdown() : showDropdown();
  });

  btnAdd.addEventListener('click', function(e) {
    e.preventDefault();
    if(options.onF2) options.onF2();
  });

  btnLookup.addEventListener('click', function(e) {
    e.preventDefault();
    if(options.onF3) options.onF3();
  });

  input.addEventListener('input', function(e) {
    var val = e.target.value.toLowerCase();
    dropdown.classList.add('active');
    
    if(!val) {
      renderTable(fullData);
      return;
    }
    
    var filtered = fullData.filter(function(row) {
      var cellContent = (row[options.colFilterIndex || 0] || '').toString().toLowerCase();
      return cellContent.includes(val);
    });
    renderTable(filtered);
  });

  document.addEventListener('click', function(e) {
    if(!container.contains(e.target) && !dropdown.contains(e.target)) {
      hideDropdown();
    }
  });

  input.addEventListener('kb:open', function() { dropdown.classList.contains('active') ? hideDropdown() : showDropdown(); });
  input.addEventListener('kb:lookup', function() { if(options.onF3) options.onF3(); });
  input.addEventListener('kb:new', function() { if(options.onF2) options.onF2(); });
  input.addEventListener('kb:close', function() { hideDropdown(); });

  container.appendChild(input);
  container.appendChild(actions);

  return container;
};
