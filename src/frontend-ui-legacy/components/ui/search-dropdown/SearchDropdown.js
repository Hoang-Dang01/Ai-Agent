/**
 * Search Dropdown Component
 * Autocomplete / Custom search results list with input and search button
 */
var UIControls = window.UIControls || {};

UIControls.createSearchDropdown = function (options) {
  var wrapper = document.createElement('div');
  wrapper.className = 'ui-search-dropdown-wrapper d-flex gap-2 align-items-center';
  wrapper.style.position = 'relative';
  wrapper.style.zIndex = '100'; // To avoid overlap issues in cards
  if (options.width) wrapper.style.width = options.width;

  var input = document.createElement('input');
  input.type = 'text';
  input.className = 'ui-input flex-grow-1';
  input.placeholder = options.placeholder || 'Tìm kiếm...';
  input.style.height = '32px';
  input.style.fontSize = '13px';

  var btn = document.createElement('button');
  btn.className = 'btn btn-outline-primary d-flex align-items-center gap-1';
  btn.style.height = '32px';
  btn.style.padding = '0 12px';
  btn.style.fontSize = '13px';
  btn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">search</span>' + (options.btnText || 'Tìm');

  var dropdown = document.createElement('div');
  dropdown.className = 'ui-search-dropdown-menu';
  
  wrapper.appendChild(input);
  wrapper.appendChild(btn);
  wrapper.appendChild(dropdown);

  function showDropdown() {
    dropdown.classList.add('show');
  }

  function hideDropdown() {
    dropdown.classList.remove('show');
  }

  function renderResults(results) {
    dropdown.innerHTML = '';
    if (!results || results.length === 0) {
      dropdown.innerHTML = '<div class="p-3 text-center text-secondary">Không tìm thấy kết quả!</div>';
    } else {
      results.forEach(function (item) {
        var div = document.createElement('a');
        div.className = 'ui-search-dropdown-item border-bottom';
        div.style.cursor = 'pointer';
        div.innerHTML = options.renderItem ? options.renderItem(item) : item.toString();
        div.addEventListener('click', function () {
          hideDropdown();
          if (typeof options.onSelect === 'function') {
            options.onSelect(item);
          }
        });
        dropdown.appendChild(div);
      });
    }
    showDropdown();
  }

  btn.addEventListener('click', function (e) {
    e.preventDefault();
    var keyword = input.value.trim();
    if (!keyword && options.requireKeyword) {
      if (window.UIToast) UIToast.show('Vui lòng nhập từ khóa', 'warning');
      return;
    }
    dropdown.innerHTML = '<div class="p-3 text-center text-secondary">Đang tìm kiếm...</div>';
    showDropdown();
    
    if (typeof options.onSearch === 'function') {
      options.onSearch(keyword, renderResults, hideDropdown);
    }
  });

  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      btn.click();
    }
  });

  document.addEventListener('click', function (e) {
    if (!wrapper.contains(e.target)) hideDropdown();
  });

  return wrapper;
};
