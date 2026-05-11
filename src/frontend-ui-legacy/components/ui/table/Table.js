/**
 * Table Component
 * Sinh ra DataGrid Table với JS.
 */
var UITable = (function () {

  /**
   * Tạo Datagrid Table
   * @param {Object} config - { headers (Array), data (Array), columns (Array of mappings), className }
   */
  function create(config) {
    var wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper ' + (config.className || '');

    var table = document.createElement('table');
    table.className = 'data-table';

    // Thead
    if (config.headers && config.headers.length > 0) {
      var thead = document.createElement('thead');
      var trHead = document.createElement('tr');
      
      config.headers.forEach(function(h) {
        var th = document.createElement('th');
        th.innerText = h.label || h;
        if (h.width) th.style.width = h.width;
        if (h.align) th.style.textAlign = h.align;
        trHead.appendChild(th);
      });
      thead.appendChild(trHead);
      table.appendChild(thead);
    }

    // Tbody
    var tbody = document.createElement('tbody');
    
    if (config.data && config.data.length > 0) {
      config.data.forEach(function(row) {
        var tr = document.createElement('tr');
        
        // Render either via columns map or direct array
        if (config.columns) {
          config.columns.forEach(function(col) {
            var td = document.createElement('td');
            if (col.align) td.style.textAlign = col.align;
            
            var val = row[col.field];
            if (col.render) {
              var rendered = col.render(val, row);
              if (typeof rendered === 'string') td.innerHTML = rendered;
              else if (rendered instanceof Node) td.appendChild(rendered);
            } else {
              td.innerText = val !== undefined ? val : '';
            }
            tr.appendChild(td);
          });
        } else {
          // Fallback pass raw array
          row.forEach(function(cellStr) {
            var td = document.createElement('td');
            if (typeof cellStr === 'string' && cellStr.indexOf('<') > -1) {
              td.innerHTML = cellStr;
            } else {
              td.innerText = cellStr;
            }
            tr.appendChild(td);
          });
        }

        tbody.appendChild(tr);
      });
    } else {
       var trEmpty = document.createElement('tr');
       var tdEmpty = document.createElement('td');
       tdEmpty.colSpan = config.headers ? config.headers.length : 1;
       tdEmpty.style.textAlign = 'center';
       tdEmpty.style.padding = '32px';
       tdEmpty.style.color = 'var(--color-text-secondary)';
       tdEmpty.innerText = 'Không có dữ liệu';
       trEmpty.appendChild(tdEmpty);
       tbody.appendChild(trEmpty);
    }

    table.appendChild(tbody);
    wrapper.appendChild(table);

    return wrapper;
  }

  return {
    create: create
  };
})();
