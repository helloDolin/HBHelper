function createScript(file, id) {
  var s = document.createElement('script');
  id && (s.id = id);
  s.src = chrome.extension.getURL(file) + '?' + new Date().getTime();

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
  if (/sso\.(hellobike|cheyaoshi)/.test(href)) {
    // 注入TOTP相关js
    addScriptOnce('lib/sha1.js', 'sha1');
    addScriptOnce('lib/totp.js', 'totp');
    addScriptOnce('lib/qrcode.bundle.js', 'qrcode.bundle');

    insertSSOScript();
  } else if (/workflow\.hellobike[\s\S]+release\/\d+/.test(href)) {
    // 注入workflow相关js

    setTimeout(function () {
      addScriptOnce('js/app-wf.js', 'main-script');
    }, 100);
  } else if (/\/\?apply_user=\d+/.test(href)) {
    // addScriptOnce('js/app-wf-robot.js', 'main-script');
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