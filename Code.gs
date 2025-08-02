/**
 * 体重管理アプリのバックエンド - CORS完全対応版
 */

/**
 * すべてのHTTPメソッドに共通するCORSヘッダーを設定
 */
function setCORSHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '3600',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
}

/**
 * CORSプリフライトリクエスト（OPTIONS）を処理
 */
function doOptions(e) {
  console.log('OPTIONS request received');
  
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders(setCORSHeaders());
}

/**
 * GET リクエスト - データ読み込み
 */
function doGet(e) {
  console.log('GET request received');
  console.log('Parameters:', JSON.stringify(e.parameter));
  
  try {
    // UserPropertiesから読み込み
    const userProperties = PropertiesService.getUserProperties();
    const jsonData = userProperties.getProperty('weightData');
    const data = JSON.parse(jsonData || '[]');
    
    console.log('Data loaded successfully:', data.length, 'records');
    
    const response = {
      status: 'success',
      data: data,
      message: 'データを正常に読み込みました',
      timestamp: new Date().toISOString()
    };
    
    // JSONPコールバックが指定されている場合
    const callback = e.parameter && e.parameter.callback;
    if (callback) {
      const jsonpResponse = `${callback}(${JSON.stringify(response)});`;
      return ContentService
        .createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT)
        .setHeaders(setCORSHeaders());
    }
    
    // 通常のJSONレスポンス
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(setCORSHeaders());
      
  } catch (error) {
    console.error('GET Error:', error.toString());
    
    const errorResponse = {
      status: 'error',
      message: '読み込みエラー: ' + error.toString(),
      data: [],
      timestamp: new Date().toISOString()
    };
    
    // JSONPコールバックが指定されている場合
    const callback = e.parameter && e.parameter.callback;
    if (callback) {
      const jsonpResponse = `${callback}(${JSON.stringify(errorResponse)});`;
      return ContentService
        .createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT)
        .setHeaders(setCORSHeaders());
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(setCORSHeaders());
  }
}

/**
 * POST リクエスト - データ保存
 */
function doPost(e) {
  console.log('POST request received');
  console.log('Request object:', JSON.stringify(e));
  
  try {
    if (!e || !e.postData) {
      throw new Error('リクエストデータがありません');
    }
    
    console.log('POST data type:', e.postData.type);
    console.log('POST data contents:', e.postData.contents);
    
    let requestData;
    
    // FormDataの場合の処理
    if (e.postData.type === 'application/x-www-form-urlencoded') {
      const params = new URLSearchParams(e.postData.contents);
      const dataParam = params.get('data');
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
    
    console.log('Parsed request data:', JSON.stringify(requestData));
    
    if (!requestData.data || !Array.isArray(requestData.data)) {
      throw new Error('データ形式が正しくありません。dataプロパティが配列である必要があります。');
    }
    
    // UserPropertiesに保存
    const userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('weightData', JSON.stringify(requestData.data));
    
    console.log('Data saved successfully:', requestData.data.length, 'records');
    
    const response = {
      status: 'success',
      message: 'データが正常に保存されました。' + requestData.data.length + '件のレコードを保存しました。',
      savedCount: requestData.data.length,
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(setCORSHeaders());
      
  } catch (error) {
    console.error('POST Error:', error.toString());
    
    const errorResponse = {
      status: 'error',
      message: '保存エラー: ' + error.toString(),
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(setCORSHeaders());
  }
}