var cookie = {
  setItem: function (name, value) {
    var now = new Date();
    var time = now.getTime();
    var expireTime = time + 86400000 * 365;
    now.setTime(expireTime);
    document.cookie = name + '=' + value + ';expires=' + now.toGMTString() + '; path=/';
  },

  getItem: function (name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },

  removeItem: function (name) {
    this.setItem(name, '', -1);
  },
};

var getDom = function (str) {
  var dic = { 'tr': 'tbody', 'td': 'tr' };
  var tag = str.split(/[\<\>\s]/)[1];

  var tmp = document.createElement(dic[tag] || 'div');
  tmp.innerHTML = str;
  return tmp.childNodes[0];
};

var verifyCode = document.querySelector('#verifyCode');
var verifyCodePanel = verifyCode.parentNode;

var configBtn = document.createElement('a');
configBtn.classList.add('input-group-addon');
configBtn.style.fontSize = '12px';
configBtn.style.cursor = 'pointer';
configBtn.innerText = '初始化中...';
configBtn.title = '点击配置key';
verifyCodePanel.appendChild(configBtn);

var dialogWrap = getDom(
  '<div class="t-dialog-wrap hide">' +
  '   <div class="t-dialog">' +
  '     <form id="dialogForm">' +
  '       <div class="form-group" id="currentKeyContainer">' +
  '         <small>' +
  '           当前的Key为:<span class="text-success" id="currentKey"></span>' +
  '         </small>' +
  '         <button class="btn btn-xs btn-primary" type="button" id="toggle">加载中</button>' +
  '       </div>' +
  '       <div class="form-group">' +
  '         <input type="text" class="form-control" placeholder="输入key" name="key"/>' +
  '         <small>或</small>' +
  '         <input type="file" class="form-control" id="qrcodeImg"/>' +
  '         <small>或</small>' +
  '         <input type="text" class="form-control" placeholder="输入二维码URL" name="qrcodeUrl"/>' +
  '       </div>' +
  '       <div class="pull-right">' +
  '         <button class="btn btn-xs btn-default" type="button" id="cancel">取消</button>' +
  '         <button class="btn btn-xs btn-primary"  type="submit">确定</button>' +
  '       </div>' +
  '     </form>' +
  '   </div>' +
  '</div>'
);
document.body.appendChild(dialogWrap);

var dialogForm = document.querySelector('#dialogForm');
var dialogCancel = document.querySelector('#cancel');
var currentKey = document.querySelector('#currentKey');
var currentKeyContainer = document.querySelector('#currentKeyContainer');
var toggle = document.querySelector('#toggle');

var key = cookie.getItem('key');
if (!key) {
  key = localStorage.getItem('key');
  if (!key) {
    window.postMessage({
      type: 'FROM_PAGE',
      operation: 'GET_COOKIE',
      data: 'key',
    }, '*');
  } else {
    window.postMessage({
      type: 'FROM_PAGE',
      operation: 'SET_COOKIE',
      data: {
        key: 'key',
        value: key,
      },
    }, '*');
    cookie.setItem('key', key);
  }
}

// message from content script
window.addEventListener('message', function (event) {
  // We only accept messages from ourselves
  if (event.source !== window) {
    return;
  }

  if (event.data.type === 'FROM_CONTENT') {
    if (event.data.operation === 'SEND_COOKIE') {
      start(event.data.data);
      setToken();
    }
  }
});

var leftPad = function (val) {
  if (val < 10) {
    return '0' + val;
  } else {
    return val;
  }
};

var isBegin = false;
var isError = false;
var setToken = function () {
  if (isBegin) {
    var time = Math.floor(Math.round(new Date().getTime() / 1000.0) % 30);

    if (time === 0 || !verifyCode.value) {
      try {
        var token = window.getCode(key);
        if (verifyCode.value !== token) {
          verifyCode.value = token;
        }
        isError = false;
      } catch (ex) {
        isError = true;
      }
    }

    if (!isError) {
      configBtn.innerHTML = '有效时间剩余：<span class="text-danger">' + leftPad(30 - time) + '</span>s';
    } else {
      configBtn.innerHTML = '无法正确计算口令';
    }
  }

  setTimeout(setToken, 1000);
};

configBtn.addEventListener('click', function () {
  currentKey.innerText = key;
  if (!key) {
    currentKeyContainer.classList.add('hide');
  } else {
    currentKeyContainer.classList.remove('hide');
  }

  dialogWrap.classList.remove('hide');
});

dialogCancel.addEventListener('click', function () {
  dialogWrap.classList.add('hide');
});

toggle.addEventListener('click', function () {
  isBegin = !isBegin;
  if (isBegin) {
    toggle.innerText = '暂停';
  } else {
    toggle.innerText = '启动';
    configBtn.innerHTML = '暂停中';
  }
  dialogWrap.classList.add('hide');
});

var start = function (val) {
  key = val;
  cookie.setItem('key', key);
  isBegin = true;
  dialogWrap.classList.add('hide');

  window.postMessage({
    type: 'FROM_PAGE',
    operation: 'SET_COOKIE',
    data: {
      key: 'key',
      value: key,
    },
  }, '*');
};

var clear = function () {
  key = '';
  cookie.removeItem('key');
  isBegin = false;
  dialogWrap.classList.add('hide');
  configBtn.innerHTML = '点击配置key';
};

dialogForm.addEventListener('submit', function (event) {
  event.preventDefault();
  var value = this.key.value;
  var url = this.qrcodeUrl.value;
  if (!value && !url) {
    alert('请输入Key');
    return;
  }

  if (value) {
    start(value);
  } else {
    qrcode.decode(url);
  }
  this.key.value = '';
  this.qrcodeUrl.value = '';
});

var reader = new FileReader();
qrcodeImg.addEventListener('change', function (event) {
  if (!event.target.files.length) {
    return;
  }
  reader.readAsDataURL(event.target.files[0]);
});
qrcode.callback = function (result, err) {
  if (err || result.indexOf('secret=') === -1) {
    alert('二维码解码出错');
  } else {
    start(result.split('secret=')[1]);
  }
  qrcodeImg.value = '';
};
reader.onload = function (e) {
  qrcode.decode(e.target.result);
};

setToken();

// 初始化
if (!key) {
  isBegin = false;
  toggle.innerText = '启动'
  configBtn.innerHTML = '点击配置key';
} else {
  isBegin = true;
  toggle.innerText = '暂停'
}