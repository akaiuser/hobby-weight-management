/**
 * 体重管理アプリのバックエンド - 最大互換性対応版
 */

/**
 * CORSプリフライトリクエスト（OPTIONS）を処理
 */
function doOptions(e) {
  Logger.log('OPTIONS request received');
  
  var output = ContentService.createTextOutput('');
  output.setMimeType(ContentService.MimeType.TEXT);
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  output.setHeader('Access-Control-Max-Age', '3600');
  return output;
}

/**
 * GET リクエスト - データ読み込み
 */
function doGet(e) {
  Logger.log('GET request received');
  
  try {
    // パラメータの安全な取得
    var params = e && e.parameter ? e.parameter : {};
    Logger.log('Parameters: ' + JSON.stringify(params));
    
    // UserPropertiesから読み込み
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
      var output = ContentService.createTextOutput(jsonpResponse);
      output.setMimeType(ContentService.MimeType.JAVASCRIPT);
      output.setHeader('Access-Control-Allow-Origin', '*');
      output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return output;
    }
    
    // 通常のJSONレスポンス
    var output = ContentService.createTextOutput(JSON.stringify(response));
    output.setMimeType(ContentService.MimeType.JSON);
    output.setHeader('Access-Control-Allow-Origin', '*');
    output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return output;
      
  } catch (error) {
    Logger.log('GET Error: ' + error.toString());
    
    var errorResponse = {
      status: 'error',
      message: '読み込みエラー: ' + error.toString(),
      data: [],
      timestamp: new Date().toISOString()
    };
    
    var output = ContentService.createTextOutput(JSON.stringify(errorResponse));
    output.setMimeType(ContentService.MimeType.JSON);
    output.setHeader('Access-Control-Allow-Origin', '*');
    return output;
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
    
    var output = ContentService.createTextOutput(JSON.stringify(response));
    output.setMimeType(ContentService.MimeType.JSON);
    output.setHeader('Access-Control-Allow-Origin', '*');
    output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return output;
      
  } catch (error) {
    Logger.log('POST Error: ' + error.toString());
    
    var errorResponse = {
      status: 'error',
      message: '保存エラー: ' + error.toString(),
      timestamp: new Date().toISOString()
    };
    
    var output = ContentService.createTextOutput(JSON.stringify(errorResponse));
    output.setMimeType(ContentService.MimeType.JSON);
    output.setHeader('Access-Control-Allow-Origin', '*');
    return output;
  }
}