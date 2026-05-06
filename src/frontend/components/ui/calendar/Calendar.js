/**
 * Calendar Component
 * Sinh Lịch Tiệc cơ bản bằng JS. Không dùng thư viện nặng.
 */
var UICalendar = (function () {

  /**
   * Khởi tạo Lịch
   * @param {Object} config - { year, month, events (danh sách chấm đỏ/xanh) }
   */
  function create(config) {
    var wrapper = document.createElement('div');
    wrapper.className = 'ui-calendar-wrapper';

    // Header
    var header = document.createElement('div');
    header.className = 'calendar-header';
    var title = document.createElement('div');
    title.className = 'calendar-month';
    title.innerText = 'Tháng ' + (config.month + 1) + ' / ' + config.year;
    
    var controls = UIButton.createBar([
      { icon: 'chevron_left', tooltip: 'Tháng trước' },
      { text: 'Hôm nay' },
      { icon: 'chevron_right', tooltip: 'Tháng sau' }
    ]);

    header.appendChild(title);
    header.appendChild(controls);
    wrapper.appendChild(header);

    // Days Header
    var grid = document.createElement('div');
    grid.className = 'calendar-grid';

    ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].forEach(function(d) {
      var dDiv = document.createElement('div');
      dDiv.className = 'calendar-day-header';
      dDiv.innerText = d;
      grid.appendChild(dDiv);
    });

    // Date calculations
    var firstDay = new Date(config.year, config.month, 1).getDay();
    var daysInMonth = new Date(config.year, config.month + 1, 0).getDate();
    var today = new Date();

    // 빈 ô trước ngày 1
    for (let i = 0; i < firstDay; i++) {
      var empty = document.createElement('div');
      grid.appendChild(empty);
    }

    // Các ngày
    for (let i = 1; i <= daysInMonth; i++) {
      var dayCell = document.createElement('div');
      dayCell.className = 'calendar-day';
      if (today.getFullYear() === config.year && today.getMonth() === config.month && today.getDate() === i) {
        dayCell.classList.add('today');
      }

      var dayNum = document.createElement('div');
      dayNum.className = 'calendar-day-number';
      dayNum.innerText = i;
      dayCell.appendChild(dayNum);

      // Thêm events giả lập
      var evtDiv = document.createElement('div');
      evtDiv.className = 'calendar-events';
      if (config.events && config.events[i]) {
        config.events[i].forEach(function(evType) {
           var dot = document.createElement('div');
           dot.className = 'calendar-dot ' + evType;
           evtDiv.appendChild(dot);
        });
      }
      dayCell.appendChild(evtDiv);

      grid.appendChild(dayCell);
    }

    wrapper.appendChild(grid);
    return wrapper;
  }

  return {
    create: create
  };
})();
