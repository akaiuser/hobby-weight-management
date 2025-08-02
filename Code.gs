/**
 * このスクリプトは、体重管理アプリのバックエンドとして機能します。
 * Googleスプレッドシートをデータベースとして使用し、体重データの読み書きを行います。
 */

// --- 定数設定 ---
const SHEET_ID = '1sC5s4nBNCxxo_G3nB2NB2a2lJ2X8J2jnmGFaX2Jj_uE'; // 対象のスプレッドシートID
const SHEET_NAME = '体重記録'; // 対象のシート名

/**
 * CORSヘッダーを含んだJSONレスポンスを生成するヘルパー関数
 * @param {object} data - JSONとして返すオブジェクト
 * @returns {ContentService.TextOutput}
 */
function createJsonResponse(data) {
  const jsonString = JSON.stringify(data);
  return ContentService.createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*', // すべてのオリジンからのアクセスを許可
      'X-Content-Type-Options': 'nosniff'
    });
}

/**
 * HTTP GETリクエストを処理します。
 * スプレッドシートから全データを取得して返します。
 */
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const range = sheet.getDataRange();
    const values = range.getValues();

    // ヘッダー行を除外 (1行目から)
    const data = values.slice(1).map(row => {
      if (!row[0]) return null; // 日付がない行はスキップ
      const date = new Date(row[0]);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      
      return {
        date: `${yyyy}-${mm}-${dd}`,
        weight: row[1]
      };
    }).filter(item => item !== null);

    return createJsonResponse({ status: 'success', data: data });

  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

/**
 * HTTP POSTリクエストを処理します。
 * 送信されたデータでスプレッドシートを更新します。
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
    
    // シートをクリアしてから新しいデータを書き込む
    sheet.clearContents();
    sheet.appendRow(['日付', '体重']); // ヘッダー行を再設定

    const sortedData = params.data.sort((a, b) => new Date(a.date) - new Date(b.date));
    const rows = sortedData.map(item => [item.date, item.weight]);
    
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, 2).setValues(rows);
    }

    return createJsonResponse({ status: 'success', message: 'データが正常に更新されました。' });

  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}