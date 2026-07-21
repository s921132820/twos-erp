# LabelPrinter

Windows에서 실행되는 수입축산물 라벨 출력 프로그램입니다.

## 기술 구성

- C# / .NET 8
- WPF
- MVVM
- Google Apps Script REST API
- 농림축산검역본부 수입축산물 이력정보 Open API
- Windows 인쇄 시스템

## 폴더 역할

| 폴더 | 책임 |
| --- | --- |
| `Api` | 외부 HTTP API 요청/응답 계약 및 클라이언트 |
| `Config` | 애플리케이션 설정 모델과 설정 저장 |
| `Helpers` | 변환기, 검증기 등 공통 보조 기능 |
| `Models` | 품목, 이력정보, 라벨 데이터 등의 도메인 모델 |
| `Printer` | 미리보기와 Windows 프린터 출력 구현 |
| `Services` | 품목 조회, 라벨 생성 등 업무 서비스와 인터페이스 |
| `ViewModels` | 화면 상태와 명령을 관리하는 MVVM 계층 |
| `Views` | WPF Window 및 UserControl |

## 설계 원칙

- View는 표시와 사용자 입력에 집중합니다.
- ViewModel은 화면 상태와 명령을 관리합니다.
- 업무 규칙과 외부 연동은 Service 및 Api 계층으로 분리합니다.
- 외부 서비스와 프린터는 인터페이스 뒤에 두어 교체와 테스트를 쉽게 합니다.
- 장시간 작업은 `async`/`await`로 처리하고 `HttpClient`는 DI 컨테이너에서 재사용합니다.

## 개발 단계

현재는 10단계까지 구성되어 있습니다.

- WPF 애플리케이션 실행 진입점
- 품목 선택 및 출력 수량 입력 화면
- 원산지, 유통기한, 이력번호, 수입업체 표시 영역
- 출력 버튼과 상태 메시지
- UI 상태를 보관하는 `MainViewModel`

- Google Apps Script URL 및 타임아웃 설정
- DI 기반 `HttpClient` 재사용
- 비동기 GET 요청과 JSON 역직렬화
- HTTP, 타임아웃, JSON 오류의 API 예외 변환

- Spreadsheet 활성 품목 조회 서비스
- 품목 JSON 모델
- 프로그램 시작 시 비동기 품목 로드
- 품목 ComboBox 연결
- 선택한 품목의 이력번호 표시
- Spreadsheet 조회용 Apps Script 예제

- MeatWatch REST API 클라이언트 및 서비스
- 이력번호 12자리 검증
- JSON/XML 응답 처리
- 설정 가능한 인증·요청 파라미터와 응답 필드명
- 품목 선택 시 원산지와 수입업체 자동 조회
- API에 유통기한이 없을 때 `API 제공 없음` 표시

- Spreadsheet 품목과 API 이력정보를 결합하는 `LabelData`
- 라벨명 미입력 시 품목명 사용
- Spreadsheet/API 이력번호 일치 검증
- 원산지와 수입업체 필수값 검증
- 유통기한 제공 여부 명시
- 출력 단계에서 재사용할 현재 라벨 데이터 보관

- MVVM 비동기 출력 명령
- Windows 기본 프린터 자동 선택
- 80mm × 50mm 기본 라벨 레이아웃
- 지정 수량만큼 인쇄 페이지 생성
- 출력 중 중복 실행 방지
- 프린터 미설정 및 인쇄 시스템 오류 처리

- 출력 수량 1~100장 제한
- API, 라벨 생성, 프린터 예외의 사용자 메시지 통합
- UI 스레드 및 백그라운드 작업의 전역 예외 처리
- `%LocalAppData%\LabelPrinter\Logs` 일별 오류 로그
- 로그 기록 실패가 원래 오류를 가리지 않도록 보호

- 설치된 Windows 프린터 목록 조회
- 사용할 프린터 선택
- 라벨 가로·세로 크기 설정(20~300mm)
- `%LocalAppData%\LabelPrinter\printer-settings.json`에 사용자 설정 저장
- 설정 파일이 없거나 손상되면 `appsettings.json` 기본값 사용
- 저장한 설정을 다음 출력부터 즉시 적용

- Visual Studio `WinX64` 게시 프로필
- .NET 런타임을 포함하는 self-contained 배포
- 단일 `LabelPrinter.exe` 생성 설정
- PowerShell 자동 게시 및 결과 검증 스크립트
- 운영 설정 파일과 사용자 데이터 배포 지침

자세한 게시 및 설치 절차는 `DEPLOYMENT.md`를 확인합니다.
