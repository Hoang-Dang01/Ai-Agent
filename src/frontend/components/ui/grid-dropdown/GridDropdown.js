/**
 * Grid Dropdown Component
 */
var UIControls = window.UIControls || {};

UIControls.createGridDropdown = function(options) {
  var wrapper = document.createElement('div');
  wrapper.className = 'grid-cell-dropdown-wrapper';

  var input = document.createElement('input');
  input.type = 'text';
  input.className = 'grid-cell-input';
  input.placeholder = options.placeholder || '';
  if(options.value) input.value = options.value;

  var dropdown = document.createElement('div');
  dropdown.className = 'data-dropdown-menu';
  dropdown.style.left = '-1px';
  dropdown.style.width = 'max-content';
  dropdown.style.minWidth = '300px';

  var fullData = options.data || [];

  function renderTable(displayData) {
    if (UIControls.utils) {
      dropdown.innerHTML = UIControls.utils.createDropdownTableHTML(options.headers || [], displayData, options.colHighlightIndex || 0);
      var rows = dropdown.querySelectorAll('tbody tr');
      rows.forEach(row => {
        row.addEventListener('click', function(e) {
          e.stopPropagation();
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
      UIControls.utils.computeDropdownPosition(input, dropdown);
    }
    dropdown.classList.add('active');
  }
  
  function hideDropdown() {
    dropdown.classList.remove('active');
    if (dropdown.parentNode) dropdown.parentNode.removeChild(dropdown);
  }

  input.addEventListener('focus', showDropdown);
  
  input.addEventListener('input', function(e) {
    var val = e.target.value.toLowerCase();
    dropdown.classList.add('active');
    if(!val) return renderTable(fullData);
    var filtered = fullData.filter(function(row) {
      return (row[options.colFilterIndex || 0] || '').toString().toLowerCase().includes(val);
    });
    renderTable(filtered);
  });

  document.addEventListener('click', function(e) {
    if(!wrapper.contains(e.target) && !dropdown.contains(e.target)) hideDropdown();
  });

  window.addEventListener('scroll', function(e) {
      if (dropdown.classList.contains('active') && !dropdown.contains(e.target)) {
          hideDropdown();
      }
  }, true);

  wrapper.appendChild(input);
  return wrapper;
};
