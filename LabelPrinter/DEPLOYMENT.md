# LabelPrinter Windows 배포

## 필수 개발 환경

- Windows 10 또는 Windows 11 64비트
- Visual Studio 2022 Community 최신 버전
- `.NET 데스크톱 개발` 워크로드
- .NET 8 SDK

## Visual Studio에서 게시

1. `LabelPrinter.sln`을 엽니다.
2. 솔루션 구성을 `Release`로 변경합니다.
3. `LabelPrinter` 프로젝트를 마우스 오른쪽 버튼으로 클릭합니다.
4. `게시`를 선택합니다.
5. `WinX64` 프로필을 선택하고 게시합니다.
6. 결과는 `artifacts\publish\win-x64`에 생성됩니다.

## PowerShell에서 게시

솔루션 폴더에서 다음 명령을 실행합니다.

```powershell
.\scripts\publish-win-x64.ps1
```

스크립트는 .NET 8 SDK 확인, 패키지 복원, Release 게시 및 EXE 존재 확인을 순서대로 수행합니다.

## 배포 파일

다음 파일을 같은 폴더에 유지하여 배포합니다.

```text
LabelPrinter.exe
appsettings.json
```

`LabelPrinter.exe`는 .NET 런타임을 포함하는 `win-x64` self-contained 단일 실행 파일입니다. 대상 PC에 .NET 8을 별도로 설치할 필요가 없습니다.

`appsettings.json`은 배포 장소마다 API URL, 인증 파라미터 및 응답 필드명이 달라질 수 있어 EXE 외부에 유지됩니다. 이 파일을 삭제하거나 EXE와 다른 폴더로 옮기면 프로그램이 시작되지 않습니다.

## 배포 전 점검

1. `GoogleAppsScript:BaseUrl`에 배포된 Apps Script `/exec` URL을 입력합니다.
2. `MeatWatch` 설정을 승인 후 받은 최신 REST 가이드와 일치시킵니다.
3. 테스트용 이력번호로 원산지와 수입업체가 표시되는지 확인합니다.
4. Windows 기본 프린터 또는 프로그램의 출력 설정에서 프린터를 지정합니다.
5. 프린터 드라이버의 용지 크기와 프로그램의 라벨 크기를 일치시킵니다.
6. 먼저 1장만 시험 출력한 뒤 다량 출력합니다.

## 운영 데이터 위치

사용자별 데이터는 다음 경로에 저장됩니다.

```text
%LocalAppData%\LabelPrinter\printer-settings.json
%LocalAppData%\LabelPrinter\Logs\LabelPrinter-YYYY-MM-DD.log
```

프로그램을 새 버전으로 교체해도 이 폴더를 삭제하지 않으면 프린터 설정은 유지됩니다.

## 주의사항

- `appsettings.json`의 API 인증정보가 노출되지 않도록 배포 폴더 접근 권한을 제한합니다.
- Windows SmartScreen 경고를 줄이려면 운영 배포 전에 코드 서명 인증서로 `LabelPrinter.exe`에 서명하는 것이 좋습니다.
- 현재 게시 대상은 64비트 Windows입니다. 32비트 Windows 지원이 필요하면 별도의 `win-x86` 프로필을 만들어야 합니다.
