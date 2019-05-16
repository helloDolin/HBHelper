var pageName = location.pathname;

var getPrefixName = (id) => {
  return pageName + '_' + id;
};

var state = {
  save(id, val) {
    localStorage.setItem(getPrefixName(id), val);
  },
  getVal(id) {
    return localStorage.getItem(getPrefixName(id));
  },
};

var selectEventHandler = (event) => {
  var target = event.target;
  state.save(target.name, target.value);
};

var bindState = () => {
  var selects = document.querySelectorAll('select[name]');
  selects.forEach((item) => {
    var name = item.name;
    if (name) {
      var val = state.getVal(name);
      if (val !== undefined && val !== null) {
        item.value = val;
        item.dispatchEvent(new Event('change'));
      }
    }

    item.removeEventListener('change', selectEventHandler);
    item.addEventListener('change', selectEventHandler);
  });
};

bindState();