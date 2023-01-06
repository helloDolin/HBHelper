function createScript(file, id) {
  var s = document.createElement('script');
  id && (s.id = id);
  s.src = chrome.runtime.getURL(file) + '?' + new Date().getTime();

  return s;
}

function addScriptOnce(file, id) {
  if (id) {
    var tmp = document.querySelector('#' + id);
    if (tmp) {
      return;
    }
  }

  document.body.appendChild(createScript(file, id));
}

function insertSSOScript() {
  if (document.querySelector('#verifyCode')) {
    setTimeout(function () {
      addScriptOnce('js/app-sso.js', 'main-script');
    }, 1000);
  } else {
    setTimeout(insertSSOScript, 1000);
  }
}

function init() {
  var href = location.href;
  var host = location.host;
  if (/sso.*\.(hellobike|cheyaoshi)/.test(href)) {
    // 注入TOTP相关js
    addScriptOnce('lib/sha1.js', 'sha1');
    addScriptOnce('lib/totp.js', 'totp');
    addScriptOnce('lib/qrcode.bundle.js', 'qrcode.bundle');

    insertSSOScript();
  } else if (host === 'crp.hellobike.cn') {
    addScriptOnce('js/app-crp.js');
  }
}

init();

window.addEventListener("message", function (event) {
  // We only accept messages from ourselves
  if (event.source !== window) {
    return;
  }

  if (event.data.type === 'FROM_PAGE') {
    if (event.data.operation === 'SET_COOKIE') {
      var data = event.data.data;
      var storage = {};
      storage[data.key] = data.value;
      chrome.storage.local.set(storage);
    } else if (event.data.operation === 'GET_COOKIE') {
      var key = event.data.data;
      chrome.storage.local.get(key, function (value) {
        if (value[key]) {
          window.postMessage({
            type: 'FROM_CONTENT',
            operation: 'SEND_COOKIE',
            data: value[key],
          }, '*');
        }
      });
    }
  }
});