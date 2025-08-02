/**
 * 体重管理アプリのバックエンド
 * CORS対応強化版
 */

const SHEET_ID = '1sC5s4nBNCxxo_G3nB2NB2a2lJ2X8J2jnmGFaX2Jj_uE';
const SHEET_NAME = '体重記録';

/**
 * CORSプリフライトリクエスト（OPTIONS）を処理
 */
function doOptions(e) {
  Logger.log('OPTIONS request received');
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
  
  try {
    // UserPropertiesから読み込み（スプレッドシートの代わり）
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
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
        'Access-Control-Allow-Origin': '*'
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
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('リクエストデータがありません');
    }
    
    Logger.log('POST data contents: ' + e.postData.contents);
    
    const requestData = JSON.parse(e.postData.contents);
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
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
        'Access-Control-Allow-Origin': '*'
      });
  }
}