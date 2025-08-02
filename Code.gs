/**
 * 体重管理アプリのバックエンド - GAS互換性対応版
 */

/**
 * CORSプリフライトリクエスト（OPTIONS）を処理
 */
function doOptions(e) {
  Logger.log('OPTIONS request received');
  
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .withHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '3600'
    });
}

/**
 * GET リクエスト - データ読み込み
 */
function doGet(e) {
  Logger.log('GET request received');
  
  try {
    // パラメータの安全な取得
    const params = e && e.parameter ? e.parameter : {};
    Logger.log('Parameters: ' + JSON.stringify(params));
    
    // UserPropertiesから読み込み
    const userProperties = PropertiesService.getUserProperties();
    const jsonData = userProperties.getProperty('weightData');
    const data = JSON.parse(jsonData || '[]');
    
    Logger.log('Data loaded successfully: ' + data.length + ' records');
    
    const response = {
      status: 'success',
      data: data,
      message: 'データを正常に読み込みました',
      timestamp: new Date().toISOString()
    };
    
    // JSONPコールバックが指定されている場合
    const callback = params.callback;
    if (callback) {
      const jsonpResponse = callback + '(' + JSON.stringify(response) + ');';
      return ContentService
        .createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT)
        .withHeaders({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        });
    }
    
    // 通常のJSONレスポンス
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON)
      .withHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      
  } catch (error) {
    Logger.log('GET Error: ' + error.toString());
    
    const errorResponse = {
      status: 'error',
      message: '読み込みエラー: ' + error.toString(),
      data: [],
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON)
      .withHeaders({
        'Access-Control-Allow-Origin': '*'
      });
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
    
    let requestData;
    
    // FormDataの場合の処理
    if (e.postData.type === 'application/x-www-form-urlencoded') {
      const contents = e.postData.contents || '';
      const params = contents.split('&');
      let dataParam = null;
      for (let i = 0; i < params.length; i++) {
        if (params[i].startsWith('data=')) {
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
    const userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('weightData', JSON.stringify(requestData.data));
    
    Logger.log('Data saved successfully: ' + requestData.data.length + ' records');
    
    const response = {
      status: 'success',
      message: 'データが正常に保存されました。' + requestData.data.length + '件のレコードを保存しました。',
      savedCount: requestData.data.length,
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON)
      .withHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      
  } catch (error) {
    Logger.log('POST Error: ' + error.toString());
    
    const errorResponse = {
      status: 'error',
      message: '保存エラー: ' + error.toString(),
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON)
      .withHeaders({
        'Access-Control-Allow-Origin': '*'
      });
  }
}