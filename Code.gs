/**
 * このスクリプトは、体重管理アプリのバックエンドとして機能します。
 * Googleスプレッドシートをデータベースとして使用し、体重データの読み書きを行います。
 *
 * 機能：
 * 1. doGet: スプレッドシートからすべての体重データを取得し、JSON形式で返します。
 * 2. doPost: 新しい体重データを受け取り、スプレッドシートを更新します。
 */

// --- 定数設定 ---
const SHEET_ID = '1sC5s4nBNCxxo_G3nB2NB2a2lJ2X8J2jnmGFaX2Jj_uE'; // 対象のスプレッドシートID
const SHEET_NAME = '体重記録'; // 対象のシート名

/**
 * HTTP GETリクエストを処理します。
 * スプレッドシートから全データを取得して返します。
 * @param {object} e - イベントオブジェクト
 * @returns {ContentService.TextOutput} JSON形式のデータ
 */
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const range = sheet.getDataRange();
    const values = range.getValues();

    // ヘッダー行を除外 (1行目から)
    const data = values.slice(1).map(row => {
      if (!row[0]) return null; // 日付がない行はスキップ
      // 日付オブジェクトを 'yyyy-MM-dd' 形式の文字列に変換
      const date = new Date(row[0]);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      
      return {
        date: `${yyyy}-${mm}-${dd}`,
        weight: row[1]
      };
    }).filter(item => item !== null); // nullの要素を除外

    const output = {
      status: 'success',
      data: data
    };
    
    // ▼▼▼【修正点1】CORS許可ヘッダーを追加 ▼▼▼
    return ContentService.createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*' // すべてのオリジンからのアクセスを許可
      });

  } catch (error) {
    const errorOutput = {
      status: 'error',
      message: error.toString()
    };
    
    // ▼▼▼【修正点2】エラー時にもCORS許可ヘッダーを追加 ▼▼▼
    return ContentService.createTextOutput(JSON.stringify(errorOutput))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*' // すべてのオリジンからのアクセスを許可
      });
  }
}

/**
 * HTTP POSTリクエストを処理します。
 * 送信されたデータでスプレッドシートを更新します。
 * @param {object} e - イベントオブジェクト (e.postData.contents にJSON文字列が含まれる)
 * @returns {ContentService.TextOutput} 処理結果を示すJSON
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

    // 日付でソートしてから書き込む
    const sortedData = params.data.sort((a, b) => new Date(a.date) - new Date(b.date));
    const rows = sortedData.map(item => [item.date, item.weight]);
    
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, 2).setValues(rows);
    }

    const output = {
      status: 'success',
      message: 'データが正常に更新されました。'
    };

    // ▼▼▼【修正点3】既存のヘッダーにCORS許可ヘッダーを追加 ▼▼▼
    return ContentService.createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*', // すべてのオリジンからのアクセスを許可
        'X-Content-Type-Options': 'nosniff'
      });

  } catch (error) {
    // エラーハンドリング
    const errorOutput = {
      status: 'error',
      message: error.toString()
    };

    // ▼▼▼【修正点4】エラー時にもCORS許可ヘッダーを追加 ▼▼▼
    return ContentService.createTextOutput(JSON.stringify(errorOutput))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*', // すべてのオリジンからのアクセスを許可
        'X-Content-Type-Options': 'nosniff'
      });
  }
}