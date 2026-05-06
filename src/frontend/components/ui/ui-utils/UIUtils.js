/**
 * Shared UI Utilities for Components
 */
var UIControls = window.UIControls || {};

UIControls.utils = (function() {
  /**
   * Tính toán vụ trí Dropdown thông minh (Tránh tràn màn hình)
   */
  function computeDropdownPosition(inputElement, dropdownElement) {
    var rect = inputElement.getBoundingClientRect();
    
    dropdownElement.style.position = 'fixed';
    dropdownElement.style.zIndex = '99999';
    dropdownElement.style.left = rect.left + 'px';
    dropdownElement.style.minWidth = rect.width + 'px';
    
    // Khôi phục chiều cao mặc định
    dropdownElement.style.maxHeight = '300px';

    // Hiện tạm để đo chiều cao thật
    var wasActive = dropdownElement.classList.contains('active');
    if (!wasActive) {
      dropdownElement.style.visibility = 'hidden';
      dropdownElement.classList.add('active');
    }

    var dropHeight = dropdownElement.offsetHeight;
    var spaceBelow = window.innerHeight - rect.bottom;
    var spaceAbove = rect.top;

    if (spaceBelow < dropHeight && spaceAbove > spaceBelow) {
      if (spaceAbove < dropHeight) {
        dropdownElement.style.maxHeight = (spaceAbove - 10) + 'px';
        dropHeight = dropdownElement.offsetHeight;
      }
      dropdownElement.style.top = (rect.top - dropHeight - 4) + 'px';
    } else {
      if (spaceBelow < dropHeight) {
        dropdownElement.style.maxHeight = (spaceBelow - 10) + 'px';
      }
      dropdownElement.style.top = (rect.bottom + 4) + 'px';
    }

    if (!wasActive) {
      dropdownElement.classList.remove('active');
      dropdownElement.style.visibility = '';
    }
  }

  /**
   * Sinh HTML cho Dropdown Table List
   */
  function createDropdownTableHTML(headers, data, colHighlightIndex) {
    var theadHTML = headers.map(h => `<th>${h}</th>`).join('');
    var tbodyHTML = data.map(function(row, rIdx) {
      var cells = row.map(function(cell, cIdx) {
        var cls = (cIdx === colHighlightIndex) ? 'highlight-col' : '';
        return `<td class="${cls}">${cell}</td>`;
      }).join('');
      return `<tr data-index="${rIdx}">${cells}</tr>`;
    }).join('');

    return `
      <table class="dropdown-table">
        <thead><tr>${theadHTML}</tr></thead>
        <tbody>${tbodyHTML}</tbody>
      </table>
    `;
  }

  return {
    computeDropdownPosition: computeDropdownPosition,
    createDropdownTableHTML: createDropdownTableHTML,
    /**
     * Setup single row selection for a table
     */
    setupTableSelection: function(tableBody, onSelect) {
      if (!tableBody) return;
      tableBody.addEventListener('click', function(e) {
        var tr = e.target.closest('tr');
        if (!tr) return;
        
        var isAlreadyActive = tr.classList.contains('active');
        
        // Remove active from all rows
        Array.from(tableBody.querySelectorAll('tr')).forEach(r => r.classList.remove('active'));
        
        // If it wasn't active, make it active
        if (!isAlreadyActive) {
          tr.classList.add('active');
          if (typeof onSelect === 'function') onSelect(tr);
        } else {
          // If it was already active, we just removed it above, so we pass null to onSelect
          if (typeof onSelect === 'function') onSelect(null);
        }
      });
    }
  };
})();
