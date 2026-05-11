/**
 * Stepper Component
 * Sinh thanh điều hướng tiến trình nhiều bước (VD: Step 1 -> Step 2 -> Step 3)
 */
var UIStepper = (function () {

  /**
   * Tạo Thanh Trình Tự
   * @param {Array} steps - [{ label: 'Chọn Sảnh' }, { label: 'Chọn Món' }]
   * @param {number} currentStepIndex - Bắt đầu từ 0
   */
  function create(steps, currentStepIndex) {
    currentStepIndex = currentStepIndex || 0;
    
    var wrapper = document.createElement('div');
    wrapper.className = 'ui-stepper';

    steps.forEach(function(step, index) {
      var stepDiv = document.createElement('div');
      stepDiv.className = 'ui-step';
      
      if (index < currentStepIndex) {
        stepDiv.classList.add('completed');
      } else if (index === currentStepIndex) {
        stepDiv.classList.add('active');
      }

      var circle = document.createElement('div');
      circle.className = 'ui-step-circle';
      if (index < currentStepIndex) {
        circle.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;">check</span>';
      } else {
        circle.innerText = (index + 1);
      }

      var label = document.createElement('div');
      label.className = 'ui-step-label';
      label.innerText = step.label;

      stepDiv.appendChild(circle);
      stepDiv.appendChild(label);
      wrapper.appendChild(stepDiv);
    });

    return wrapper;
  }

  return {
    create: create
  };
})();
