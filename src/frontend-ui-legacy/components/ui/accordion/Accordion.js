/**
 * Accordion Component (Mở rộng / Thu gọn)
 * Áp dụng cho các Form quá dài cần gom nhóm lại
 */
var UIAccordion = (function () {

  /**
   * Tạo khối thu gọn Accordion
   * @param {Object} config - { title, content (Node/String), isOpen }
   */
  function create(config) {
    var wrapper = document.createElement('div');
    wrapper.className = 'ui-accordion';
    if (config.isOpen) wrapper.classList.add('open');

    var header = document.createElement('div');
    header.className = 'ui-accordion-header';

    var titleSpan = document.createElement('span');
    titleSpan.innerText = config.title;

    var iconSpan = document.createElement('span');
    iconSpan.className = 'material-symbols-outlined ui-accordion-icon';
    iconSpan.innerText = 'keyboard_arrow_down';

    header.appendChild(titleSpan);
    header.appendChild(iconSpan);

    var body = document.createElement('div');
    body.className = 'ui-accordion-body';

    if (typeof config.content === 'string') {
      body.innerHTML = config.content;
    } else if (config.content instanceof Node) {
      body.appendChild(config.content);
    }

    wrapper.appendChild(header);
    wrapper.appendChild(body);

    header.addEventListener('click', function() {
      wrapper.classList.toggle('open');
    });

    return wrapper;
  }

  return {
    create: create
  };
})();
