/**
 * Timeline Component
 * Sinh ra Danh sách Lịch sử thao tác (VD: Cọc lần 1 -> Đổi cọc -> Cọc lần 2 -> Ký Hợp Đồng)
 */
var UITimeline = (function () {

  /**
   * Tạo Timeline
   * @param {Array} events - [{ title, time, desc, type: 'success'|'primary'|'' }]
   */
  function create(events) {
    var wrapper = document.createElement('div');
    wrapper.className = 'ui-timeline';

    events.forEach(function(ev) {
      var item = document.createElement('div');
      item.className = 'timeline-item ' + (ev.type || '');

      var marker = document.createElement('div');
      marker.className = 'timeline-marker';

      var content = document.createElement('div');
      content.className = 'timeline-content';

      var title = document.createElement('div');
      title.className = 'timeline-title';
      title.innerText = ev.title;

      var time = document.createElement('div');
      time.className = 'timeline-time';
      time.innerText = ev.time || '';

      content.appendChild(title);
      content.appendChild(time);

      if (ev.desc) {
        var desc = document.createElement('div');
        desc.className = 'timeline-desc';
        desc.innerText = ev.desc;
        content.appendChild(desc);
      }

      item.appendChild(marker);
      item.appendChild(content);
      wrapper.appendChild(item);
    });

    return wrapper;
  }

  return {
    create: create
  };
})();
