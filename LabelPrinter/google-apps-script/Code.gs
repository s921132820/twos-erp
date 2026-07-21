const DEFAULT_SHEET_NAME = '품목';

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || '').trim();

    if (action === 'products') {
      return jsonResponse_(true, getActiveProducts_(), null);
    }

    return jsonResponse_(false, null, '지원하지 않는 action입니다.');
  } catch (error) {
    console.error(error);
    return jsonResponse_(false, null, '서버에서 요청을 처리하지 못했습니다.');
  }
}

function getActiveProducts_() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = properties.getProperty('SPREADSHEET_ID');
  const sheetName = properties.getProperty('SHEET_NAME') || DEFAULT_SHEET_NAME;

  if (!spreadsheetId) {
    throw new Error('스크립트 속성 SPREADSHEET_ID가 설정되지 않았습니다.');
  }

  const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`시트 '${sheetName}'을 찾을 수 없습니다.`);
  }

  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) {
    return [];
  }

  const headers = values[0].map(value => String(value).trim());
  const indexes = {
    productCode: requiredColumnIndex_(headers, '품목코드'),
    productName: requiredColumnIndex_(headers, '품목명'),
    traceNumber: requiredColumnIndex_(headers, '이력번호'),
    labelName: requiredColumnIndex_(headers, '라벨명'),
    enabled: requiredColumnIndex_(headers, '사용여부')
  };

  return values
    .slice(1)
    .filter(row => String(row[indexes.enabled]).trim().toUpperCase() === 'Y')
    .map(row => ({
      productCode: String(row[indexes.productCode]).trim(),
      productName: String(row[indexes.productName]).trim(),
      traceNumber: String(row[indexes.traceNumber]).trim(),
      labelName: String(row[indexes.labelName]).trim(),
      isActive: true
    }))
    .filter(product => product.productCode && product.productName && product.traceNumber);
}

function requiredColumnIndex_(headers, columnName) {
  const index = headers.indexOf(columnName);
  if (index < 0) {
    throw new Error(`필수 열 '${columnName}'을 찾을 수 없습니다.`);
  }

  return index;
}

function jsonResponse_(success, data, message) {
  return ContentService
    .createTextOutput(JSON.stringify({ success, data, message }))
    .setMimeType(ContentService.MimeType.JSON);
}
