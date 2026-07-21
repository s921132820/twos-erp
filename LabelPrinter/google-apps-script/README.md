# Google Apps Script 배포

1. Spreadsheet 첫 행에 `품목코드`, `품목명`, `이력번호`, `라벨명`, `사용여부` 열을 만듭니다.
2. Apps Script 프로젝트에 `Code.gs` 내용을 붙여 넣습니다.
3. 프로젝트 설정의 스크립트 속성에 `SPREADSHEET_ID`를 등록합니다.
4. 시트명이 `품목`이 아니면 `SHEET_NAME` 속성도 등록합니다.
5. 웹 앱으로 새 배포하고 실행 사용자는 본인, 액세스 권한은 프로그램 운영 정책에 맞게 지정합니다.
6. 생성된 `/exec` URL을 WPF 프로젝트의 `appsettings.json`에 입력합니다.

테스트 요청:

```text
https://script.google.com/macros/s/배포_ID/exec?action=products
```

정상 응답 예시:

```json
{
  "success": true,
  "data": [
    {
      "productCode": "P001",
      "productName": "미국산 LA갈비 11mm",
      "traceNumber": "123456789012",
      "labelName": "LA갈비",
      "isActive": true
    }
  ],
  "message": null
}
```
