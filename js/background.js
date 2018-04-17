var post = function (url, body) {
  var http = new XMLHttpRequest();

  return new Promise(function (resolve, reject) {
    http.open('POST', url, true);

    http.setRequestHeader('Content-type', 'application/json');
    http.setRequestHeader('charset', 'utf-8');

    http.onreadystatechange = function () {
      if (http.readyState === 4 && http.status === 200) {
        resolve(JSON.parse(http.responseText));
      }
    }
    http.send(JSON.stringify(body));
  });
};