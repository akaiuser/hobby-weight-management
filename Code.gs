/**
 * 体重管理アプリのバックエンド - 最古互換性対応版
 */

/**
 * CORSプリフライトリクエスト（OPTIONS）を処理
 */
function doOptions(e) {
  Logger.log('OPTIONS request received');
  
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * GET リクエスト - データ読み込み と JSONP保存処理
 */
function doGet(e) {
  Logger.log('GET request received');
  
  try {
    // パラメータの安全な取得
    var params = e && e.parameter ? e.parameter : {};
    Logger.log('Parameters: ' + JSON.stringify(params));
    
    // actionパラメータで保存処理かどうかを判定
    if (params.action === 'save') {
      return handleJSONPSave(params);
    }
    
    // 通常の読み込み処理
    var userProperties = PropertiesService.getUserProperties();
    var jsonData = userProperties.getProperty('weightData');
    var data = JSON.parse(jsonData || '[]');
    
    Logger.log('Data loaded successfully: ' + data.length + ' records');
    
    var response = {
      status: 'success',
      data: data,
      message: 'データを正常に読み込みました',
      timestamp: new Date().toISOString()
    };
    
    // JSONPコールバックが指定されている場合
    var callback = params.callback;
    if (callback) {
      var jsonpResponse = callback + '(' + JSON.stringify(response) + ');';
      return ContentService
        .createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    // 通常のJSONレスポンス
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('GET Error: ' + error.toString());
    
    var errorResponse = {
      status: 'error',
      message: '読み込みエラー: ' + error.toString(),
      data: [],
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * POST リクエスト - データ保存
 */
function doPost(e) {
  Logger.log('POST request received');
  
  try {
    if (!e || !e.postData) {
      throw new Error('リクエストデータがありません');
    }
    
    Logger.log('POST data type: ' + (e.postData.type || 'unknown'));
    Logger.log('POST data contents: ' + (e.postData.contents || 'empty'));
    
    var requestData;
    
    // FormDataの場合の処理
    if (e.postData.type === 'application/x-www-form-urlencoded') {
      var contents = e.postData.contents || '';
      var params = contents.split('&');
      var dataParam = null;
      for (var i = 0; i < params.length; i++) {
        if (params[i].indexOf('data=') === 0) {
          dataParam = decodeURIComponent(params[i].substring(5));
          break;
        }
      }
      if (!dataParam) {
        throw new Error('dataパラメータが見つかりません');
      }
      requestData = { data: JSON.parse(dataParam) };
    } 
    // JSONの場合の処理
    else if (e.postData.contents) {
      requestData = JSON.parse(e.postData.contents);
    } 
    else {
      throw new Error('リクエストデータが空です');
    }
    
    Logger.log('Parsed request data: ' + JSON.stringify(requestData));
    
    if (!requestData.data || !Array.isArray(requestData.data)) {
      throw new Error('データ形式が正しくありません。dataプロパティが配列である必要があります。');
    }
    
    // UserPropertiesに保存
    var userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('weightData', JSON.stringify(requestData.data));
    
    Logger.log('Data saved successfully: ' + requestData.data.length + ' records');
    
    var response = {
      status: 'success',
      message: 'データが正常に保存されました。' + requestData.data.length + '件のレコードを保存しました。',
      savedCount: requestData.data.length,
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('POST Error: ' + error.toString());
    
    var errorResponse = {
      status: 'error',
      message: '保存エラー: ' + error.toString(),
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * JSONP保存処理を行う関数
 */
function handleJSONPSave(params) {
  Logger.log('JSONP Save request received');
  
  try {
    if (!params.data) {
      throw new Error('dataパラメータが見つかりません');
    }
    
    // URLデコードしてJSONパース
    var dataString = decodeURIComponent(params.data);
    var data = JSON.parse(dataString);
    
    Logger.log('Parsed JSONP save data: ' + JSON.stringify(data));
    
    if (!Array.isArray(data)) {
      throw new Error('データが配列形式ではありません');
    }
    
    // UserPropertiesに保存
    var userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('weightData', JSON.stringify(data));
    
    Logger.log('JSONP save completed: ' + data.length + ' records');
    
    var response = {
      status: 'success',
      message: 'データが正常に保存されました。' + data.length + '件のレコードを保存しました。',
      savedCount: data.length,
      timestamp: new Date().toISOString()
    };
    
    // JSONPコールバック
    var callback = params.callback;
    if (callback) {
      var jsonpResponse = callback + '(' + JSON.stringify(response) + ');';
      return ContentService
        .createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('JSONP Save Error: ' + error.toString());
    
    var errorResponse = {
      status: 'error',
      message: 'JSONP保存エラー: ' + error.toString(),
      timestamp: new Date().toISOString()
    };
    
    var callback = params.callback;
    if (callback) {
      var jsonpResponse = callback + '(' + JSON.stringify(errorResponse) + ');';
      return ContentService
        .createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}