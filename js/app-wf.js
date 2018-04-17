Array.prototype.move = function (old_index, new_index) {
  if (new_index >= this.length) {
    var k = new_index - this.length;
    while ((k--) + 1) {
      this.push(undefined);
    }
  }
  this.splice(new_index, 0, this.splice(old_index, 1)[0]);
  return this; // for testing purposes
};

var s4 = function () {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
};

var createGuid = function () {
  return s4() + s4() + '-' + s4() + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

var $body = $('body');
var $iboxTitle = $('#page-wrapper .ibox-title').eq(0);
var $btnSubmit = $('#btn_submit');

var $configBtn = $('<button>', {
  'class': 'btn btn-xs btn-primary',
  text: '一键发布管理',
});

var $addConfigBtn = $('<button>', {
  'class': 'btn btn-sm btn-primary',
  style: 'margin-left:20px;display: none;',
  text: '保存当前发布配置',
});

var $settingBtnContainer = $('<div style="display: inline-block"></div>');

var html = [
  '<div class="modal" data-backdrop="static">',
  ' <div class="modal-dialog" style="width: 400px">',
  '   <div class="modal-content">',
  '     <div class="modal-header">',
  '       <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">×</span><span class="sr-only">Close</span></button>',
  '       <h4 class="modal-title"></h4>',
  '     </div>' +
  '     <form>',
  '       <div class="modal-body">' +
  '         <input type="text" class="form-control" name="promptValue">' +
  '       </div>',
  '       <div class="modal-footer">',
  '         <button type="button" class="btn btn-sm btn-white" data-dismiss="modal">取消</button>',
  '         <button type="submit" class="btn btn-sm btn-primary">确定</button>',
  '       </div>' +
  '     </form>',
  '   </div>',
  ' </div>',
  '</div>'
].join('');

var prompt = function (title) {
  var $modal = $(html);
  var dfd = $.Deferred();

  $modal.find('.modal-title').text(title);
  $modal.find('form').on('submit', function (event) {
    event.preventDefault();
    dfd.resolve(this.promptValue.value);
    $modal.modal('hide');
  });

  //隐藏时删除
  $modal.on('hidden.bs.modal', function () {
    dfd.reject();
    $modal.remove();
  });

  $modal.modal();
  return dfd.promise();
};

var $configDialog =
  $('<div class="modal fade" tabindex="-1" role="dialog">' +
    ' <div class="modal-dialog modal-lg" role="document">' +
    '   <div class="modal-content">' +
    '     <div class="modal-header">' +
    '       管理一键发布列表' +
    '       <button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
    '           <span aria-hidden="true">&times;</span>' +
    '       </button>' +
    '     </div>' +
    '     <div class="modal-body">' +
    '     </div>' +
    '     <div class="modal-footer">' +
    '       <button type="button" class="btn btn-default" data-dismiss="modal">关闭</button>' +
    '     </div>' +
    '   </div>' +
    ' </div>' +
    '</div>');

var $configTable =
  $('<table class="table table-hover table-striped">' +
    ' <thead>' +
    '   <tr>' +
    '     <th>别名</th>' +
    '     <th>App名称</th>' +
    '     <th>AppId</th>' +
    '     <th>ENV</th>' +
    '     <th>服务器</th>' +
    '     <th>操作</th>' +
    '     <th>排序</th>' +
    '   </tr>' +
    ' </thead>' +
    ' <tbody id="configList">' +
    ' </tbody>' +
    '</table>');

var $dialogBody = $configDialog.find('.modal-body');
var $btnContainer = $('#page-wrapper').find('.ibox-content .text-center');

$body.append($configDialog);
$iboxTitle.append($configBtn);
$iboxTitle.append('<span style="margin: 0 12px;">|</span>');
$iboxTitle.append($settingBtnContainer);
$dialogBody.append($configTable);
$btnContainer.append($addConfigBtn);

var $configList = $dialogBody.find('#configList');

var renderBtnList = function (list) {
  var configList = list || getConfig();
  $settingBtnContainer.empty();

  configList.forEach(function (config) {
    var btn = $('<button>', {
      'class': 'btn btn-xs btn-info autoSetRelease',
      style: 'margin-right: 4px',
      text: config.alias.length > 10 ?
        config.alias.substring(0, 10) + '...' :
        config.alias,
      title: config.alias,
    });
    btn.data('config', config);
    $settingBtnContainer.append(btn);
  });
};

var getConfig = function () {
  try {
    return JSON.parse(localStorage.getItem('hb_config')) || [];
  } catch (ex) {
    console.warn(ex);
    return [];
  }
};

var saveConfig = function (list) {
  renderBtnList(list);
  localStorage.setItem('hb_config', JSON.stringify(list));
};

var addConfig = function (item) {
  var list = getConfig();
  list.push(item);
  saveConfig(list);
};

var deleteConfigByGuid = function (guid) {
  var list = getConfig();
  var index = list.findIndex(function (p) {
    return p.guid === guid;
  });
  if (index > -1) {
    list.splice(index, 1);
  }
  saveConfig(list);
};

var moveConfigByGuid = function (guid, direction) {
  var list = getConfig();
  var oldIndex = list.findIndex(function (p) {
    return p.guid === guid;
  });
  list.move(oldIndex, oldIndex + direction);
  saveConfig(list);
};

var renderConfigList = function () {
  var configList = getConfig();
  $configList.empty();
  configList.forEach(function (config, index) {
    var result = [];
    result.push('<tr>');
    result.push('<td>' + config.alias + '</td>');
    result.push('<td>' + config.appName + '</td>');
    result.push('<td>' + config.appId + '</td>');
    result.push('<td>' + config.env + '</td>');
    result.push('<td>');
    result.push((config.servers || []).map(function (server) {
      return server.serverIp + ',' + server.serverTeam;
    }).join('<br/>'));
    result.push('</td>');
    result.push('<td>' +
      ' <a data-guid="' + config.guid + '"' +
      '    href="javascript:void(0)" class="delete">删除</a>' +
      '</td>');
    result.push('<td>');
    if (index > 0) {
      result.push(' <a data-guid="' + config.guid + '"' +
        '    href="javascript:void(0)" class="moveup">上移</a>');
    }
    if (index < configList.length - 1) {
      result.push(' <a data-guid="' + config.guid + '"' +
        '    href="javascript:void(0)" class="movedown">下移</a>');
    }
    result.push('</td>');
    result.push('</tr>');

    $configList.append(result.join(''));
  });
};
$configBtn.on('click', function () {
  renderConfigList();
  $configDialog.modal('show');
});

$addConfigBtn.on('click', function () {
  var servers = $.map($('input[data-ip]:checked'), function (item) {
    var $server = $(item);
    return {
      serverId: $server.data('id'),
      serverIp: $server.data('ip'),
      serverName: $server.data('name'),
      serverTeam: $server.data('team'),
    };
  });

  var item = {
    appName: $('#select-app e').text(),
    appId: $('#select-app e').data('app_id'),
    env: $('#env').val(),
    servers: servers,
    noBatch: $('#nobatch').prop('checked'),
    batchPattern: $('#batchPattern').val(),
    pauseTime: $('#pauseTime').val(),
    guid: createGuid(),
    scheduleUrgent: $('#schedule-urgent').prop('checked'),
  };
  prompt('给配置取一个别名:').then(function (name) {
    item.alias = name;
    addConfig(item);
    window.modal.info('配置保存成功');
  });
});

$('#btn_pre_submit, #btn_next_submit').on('click', function () {
  if ($btnSubmit.is(':visible') && !$btnSubmit.data('is-auto')) {
    $addConfigBtn.show();
  } else {
    $addConfigBtn.hide();
  }
});

// 删除
$configList.on('click', '.delete', function () {
  var guid = $(this).data('guid');
  deleteConfigByGuid(guid);
  renderConfigList();
});

// 上移
$configList.on('click', '.moveup', function () {
  var guid = $(this).data('guid');
  moveConfigByGuid(guid, -1);
  renderConfigList();
});

// 下移
$configList.on('click', '.movedown', function () {
  var guid = $(this).data('guid');
  moveConfigByGuid(guid, 1);
  renderConfigList();
});

var $btn_next_submit = $('#btn_next_submit');
var $btn_pre_submit = $('#btn_pre_submit');

// 第一步，选择应用
var firstStep = function (config) {
  $('.app-dropdown li[value=' + config.appId + ']').click();

  var oldAjax = $.ajax;
  var ajaxPromise = $.Deferred();
  var newAjax = function () {
    oldAjax.apply($, arguments).then(function (res) {
      ajaxPromise.resolve(res);
      return res;
    });
  };
  $.ajax = newAjax;

  $('#env').val(config.env).trigger('change');
  return ajaxPromise.then(function (data) {
    $.ajax = oldAjax;
    if (data) {
      config.servers.forEach(function (server) {
        $('input[data-id=' + server.serverId + ']').prop('checked', true)
      });
    }

    if (config.scheduleUrgent) {
      $('#schedule-urgent').prop('checked', config.scheduleUrgent);
    }

    $btn_next_submit.click();
    return config;
  });
};

// 第二步，选择最新标签
var secondStep = function (config) {
  $('#app-version .item.details').eq(0).click();
  $btn_next_submit.click();
  return config;
};

// 第三步，发布配置
var thirdStep = function (config) {
  $('#nobatch').prop('checked', config.noBatch);

  if (!config.noBatch) {
    $('#batchPattern').val(config.batchPattern);
    $('#pauseTime').val(config.pauseTime);
  }
  $btn_next_submit.click();
};

$settingBtnContainer.on('click', '.autoSetRelease', function () {
  var config = $(this).data('config');

  if ($btn_pre_submit.is(':visible')) {
    $btn_pre_submit.click();
    $btn_pre_submit.click();
    $btn_pre_submit.click();
  }

  $btnSubmit.data('is-auto', true);
  // 以下为自动填充提交表单的逻辑
  firstStep(config)
    .then(secondStep)
    .then(thirdStep)
    .then(function () {
      $btnSubmit.data('is-auto', false);
    });
});

renderBtnList();