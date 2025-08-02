/**
 * 体重管理アプリのバックエンド
 * CORS対応強化版 - Origin nullにも対応
 */

/**
 * CORSプリフライトリクエスト（OPTIONS）を処理
 */
function doOptions(e) {
  Logger.log('OPTIONS request received');
  Logger.log('Request parameters: ' + JSON.stringify(e));
  
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400'
    });
}

/**
 * GET リクエスト - データ読み込み
 */
function doGet(e) {
  Logger.log('GET request received');
  Logger.log('Request parameters: ' + JSON.stringify(e));
  
  try {
    // UserPropertiesから読み込み
    const userProperties = PropertiesService.getUserProperties();
    const jsonData = userProperties.getProperty('weightData');
    const data = JSON.parse(jsonData || '[]');
    
    Logger.log('Data loaded: ' + data.length + ' records');
    
    const output = { 
      status: 'success', 
      data: data,
      message: 'データを正常に読み込みました'
    };
    
    return ContentService.createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Cache-Control': 'no-cache'
      });
      
  } catch (error) {
    Logger.log('GET Error: ' + error.toString());
    
    const errorOutput = { 
      status: 'error', 
      message: '読み込みエラー: ' + error.toString(),
      data: []
    };
    
    return ContentService.createTextOutput(JSON.stringify(errorOutput))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      });
  }
}

/**
 * POST リクエスト - データ保存
 */
function doPost(e) {
  Logger.log('POST request received');
  Logger.log('Request parameters: ' + JSON.stringify(e));
  
  try {
    // リクエストデータの確認
    if (!e || !e.postData) {
      throw new Error('リクエストデータがありません');
    }
    
    Logger.log('POST data contents: ' + e.postData.contents);
    Logger.log('POST data type: ' + e.postData.type);
    
    let requestData;
    
    // FormDataとJSONの両方に対応
    if (e.postData.type === 'application/x-www-form-urlencoded') {
      // FormDataの場合
      const params = e.postData.contents.split('&');
      let dataParam = null;
      for (let param of params) {
        if (param.startsWith('data=')) {
          dataParam = decodeURIComponent(param.substring(5));
          break;
        }
      }
      if (!dataParam) {
        throw new Error('dataパラメータが見つかりません');
      }
      requestData = { data: JSON.parse(dataParam) };
    } else {
      // JSONの場合
      if (!e.postData.contents) {
        throw new Error('リクエストデータが空です');
      }
      requestData = JSON.parse(e.postData.contents);
    }
    
    Logger.log('Parsed request data: ' + JSON.stringify(requestData));
    
    if (!requestData.data || !Array.isArray(requestData.data)) {
      throw new Error('データ形式が正しくありません。dataプロパティが配列である必要があります。');
    }
    
    // UserPropertiesに保存
    const userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('weightData', JSON.stringify(requestData.data));
    
    Logger.log('Data saved successfully: ' + requestData.data.length + ' records');
    
    const output = { 
      status: 'success', 
      message: 'データが正常に保存されました。' + requestData.data.length + '件のレコードを保存しました。',
      savedCount: requestData.data.length
    };
    
    return ContentService.createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Cache-Control': 'no-cache'
      });
      
  } catch (error) {
    Logger.log('POST Error: ' + error.toString());
    
    const errorOutput = { 
      status: 'error', 
      message: '保存エラー: ' + error.toString()
    };
    
    return ContentService.createTextOutput(JSON.stringify(errorOutput))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      });
  }
}