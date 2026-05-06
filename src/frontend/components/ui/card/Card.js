/**
 * Card Component
 * Sinh khối bao bọc Card chuẩn xác bằng JS.
 */
var UICard = (function () {

  /**
   * Tạo Card
   * @param {Object} config - { title, rightElement (DOM), bodyContent (DOM/HTML), className }
   */
  function create(config) {
    var card = document.createElement('div');
    card.className = 'card ' + (config.className || '');

    // Header
    if (config.title || config.rightElement) {
      var header = document.createElement('div');
      header.className = 'card-header';
      
      var titleSpan = document.createElement('span');
      titleSpan.innerText = config.title || '';
      header.appendChild(titleSpan);

      if (config.rightElement) {
        header.appendChild(config.rightElement);
      }
      card.appendChild(header);
    }

    // Body
    var body = document.createElement('div');
    body.className = 'card-body';
    
    if (config.bodyContent) {
      if (typeof config.bodyContent === 'string') {
        body.innerHTML = config.bodyContent;
      } else {
        body.appendChild(config.bodyContent);
      }
    }

    card.appendChild(body);

    return card;
  }

  return {
    create: create
  };
})();
