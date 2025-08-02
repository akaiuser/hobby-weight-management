/**
 * このスクリプトは、体重管理アプリのバックエンドとして機能します。
 * Googleスプレッドシートをデータベースとして使用し、体重データの読み書きを行います。
 */

// --- 定数設定 ---
const SHEET_ID = '1sC5s4nBNCxxo_G3nB2NB2a2lJ2X8J2jnmGFaX2Jj_uE'; // 対象のスプレッドシートID
const SHEET_NAME = '体重記録'; // 対象のシート名

/**
 * HTTP GETリクエストを処理します。
 */
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const range = sheet.getDataRange();
    const values = range.getValues();

    const data = values.slice(1).map(row => {
      if (!row[0]) return null;
      const date = new Date(row[0]);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      
      return {
        date: `${yyyy}-${mm}-${dd}`,
        weight: row[1]
      };
    }).filter(item => item !== null);

    const output = { status: 'success', data: data };
    // お客様の元の構文に戻し、CORSヘッダーを設定
    return ContentService.createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({'Access-Control-Allow-Origin': '*'});

  } catch (error) {
    const errorOutput = { status: 'error', message: error.toString() };
    return ContentService.createTextOutput(JSON.stringify(errorOutput))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({'Access-Control-Allow-Origin': '*'});
  }
}

/**
 * HTTP POSTリクエストを処理します。
 */
function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      throw new Error('リクエストデータがありません。');
    }
    
    const params = JSON.parse(e.postData.contents);
    if (!params.data || !Array.isArray(params.data)) {
      throw new Error('データ形式が正しくありません。「data」プロパティが配列である必要があります。');
    }

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    sheet.clearContents();
    sheet.appendRow(['日付', '体重']);

    const sortedData = params.data.sort((a, b) => new Date(a.date) - new Date(b.date));
    const rows = sortedData.map(item => [item.date, item.weight]);
    
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, 2).setValues(rows);
    }

    const output = { status: 'success', message: 'データが正常に更新されました。' };
    return ContentService.createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({'Access-Control-Allow-Origin': '*'});

  } catch (error) {
    const errorOutput = { status: 'error', message: error.toString() };
    return ContentService.createTextOutput(JSON.stringify(errorOutput))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({'Access-Control-Allow-Origin': '*'});
  }
}

/**
 * CORSプリフライトリクエスト（OPTIONS）を処理します。
 */
function doOptions(e) {
  return ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-control-allow-methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}