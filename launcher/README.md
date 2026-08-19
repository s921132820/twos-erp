# 투에스푸드 ERP Windows 실행기

`투에스푸드ERP.exe`는 실행 위치에서 상위 폴더를 탐색해 `package.json`과
`pnpm-lock.yaml`이 모두 있는 ERP 루트를 찾습니다. DB를 사용하지 않는
`http://localhost:3000/api/health`가 응답하면 중복 서버를 실행하지 않고 기본
브라우저에서 `http://localhost:3000`을 엽니다. 서버가 없으면 Windows
`MySQL80` 서비스 상태를 `ServiceController`로 확인하고, 중지된 경우에만 시작하여
Running 상태를 기다립니다. 이후 `cmd.exe`를 통해 Node.js와 pnpm(Corepack 포함)을
확인하고 별도 콘솔에서 `pnpm run dev`를 실행합니다. Next.js 응답은 1초 간격으로
최대 60초 동안 `/api/health`만 순차적으로 확인합니다. 대시보드 `/`는 readiness
검사에 사용하지 않습니다.

런처는 DB 포트, `DATABASE_URL`, DB 인증 또는 Prisma 연결을 검사하지 않습니다.
이 책임은 Next.js와 Prisma에 있습니다. 실행 로그는
`%TEMP%\TwosFoodERP\launcher.log`에 기록됩니다.

## EXE 빌드

Windows에서 `launcher\build-exe.bat`를 실행하거나 다음 명령을 사용합니다.

```bat
cd launcher
dotnet publish ERPLauncher.csproj -c Release -r win-x64 --self-contained true
```

생성 위치:

```text
launcher\bin\Release\net8.0-windows\win-x64\publish\투에스푸드ERP.exe
```

실행 파일은 프로젝트 내부의 위 위치에 그대로 두는 것을 권장합니다. 바탕화면에는
EXE를 복사하지 말고, 마우스 오른쪽 버튼으로 드래그해 바로 가기를 만드세요. EXE를
프로젝트 밖으로 복사하면 상위 폴더에서 ERP 루트를 찾을 수 없습니다.

## 아이콘 변경

`launcher\app.ico`를 추가하고 `ERPLauncher.csproj`의 `PropertyGroup` 안에 아래
설정을 추가한 뒤 다시 빌드합니다.

```xml
<ApplicationIcon>app.ico</ApplicationIcon>
```

## 운영 모드 전환

운영 빌드를 사용하는 경우 `Program.cs`의 다음 한 곳만 변경합니다.

```csharp
private const string START_ARGUMENTS = "start";
```

이 경우 실행 전에 프로젝트 루트에서 `pnpm build`를 완료해야 합니다.
