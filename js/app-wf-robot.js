/**
 * Created by johnnycage on 2017/8/21.
 */

var init = function () {
  var $allCancel = $('#div_content > table [data-cancel]');
  $allCancel.each(function () {
    var item = $(this);
    var btn = $('<button>', { text: '通知NOC', 'class': 'btn btn-xs btn-warning' });
    var parent = item.parent();
    var tds = parent.parent().children();
    parent.prepend(btn);
    btn.on('click', function () {
      var project = tds.eq(1).text().split(/[\(\)]/);
      var message = {
        type: 'FROM_PAGE',
        data: {
          id: tds.eq(0).text(),
          type: project[0],
          projectId: project[1],
          username: tds.eq(2).text(),
          time: tds.eq(3).text()
        }
      };
      window.postMessage(message, '*');
    });
  });
};

window.addEventListener('message', function (event) {
  if (event.data.type === 'FROM_BACKGROUND') {
    alert(event.data.success ? '通知成功' : '通知失败');
  }
});

$(document).ajaxComplete(function (event, xhr, settings) {
  if (settings.url === '/content/') {
    init();
  }
});

init();