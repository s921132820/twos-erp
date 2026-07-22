# 투에스푸드 ERP

내 PC의 로컬 환경에서만 실행하는 제품 관리용 웹 ERP입니다. Next.js 한 프로젝트 안에서 화면과 서버 로직을 함께 관리하며, 초기 메뉴는 **우리 제품**만 제공합니다.

## 사용 기술

- Next.js(App Router), React, TypeScript
- Tailwind CSS, shadcn/ui 방식의 재사용 UI, Radix UI, Lucide 아이콘
- Prisma ORM, 로컬 MySQL
- Zod, React Hook Form(클라이언트와 서버 양쪽에서 동일한 검증 규칙 사용)

## 사전 준비

- Node.js 24 LTS 권장(최소 버전은 설치된 Next.js의 `engines` 조건 참고)
- npm 11 이상 권장
- MySQL 8.x 로컬 설치 및 실행

## 1. MySQL 데이터베이스 생성

MySQL Workbench 또는 MySQL 명령줄에서 다음 SQL을 한 번 실행합니다.

```sql
CREATE DATABASE twosfood_erp
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

## 2. 환경변수 설정

PowerShell에서 예제 파일을 복사합니다.

```powershell
Copy-Item .env.example .env
```

`.env`를 열어 로컬 MySQL 계정에 맞게 수정합니다. 비밀번호에 `@`, `#`, `/` 같은 문자가 있으면 URL 인코딩해야 합니다.

```env
DATABASE_URL="mysql://root:내비밀번호@localhost:3306/twosfood_erp"
```

`.env`는 Git에서 제외되므로 실제 비밀번호를 `.env.example`이나 소스 코드에 적지 마세요.

## 3. 설치 및 DB 준비

Windows PowerShell의 실행 정책 때문에 `npm` 실행이 차단되면 아래처럼 `npm.cmd`를 사용합니다.

```powershell
npm.cmd install
npm.cmd run db:generate
npm.cmd run db:migrate -- --name init
npm.cmd run db:seed
```

- `db:generate`: Prisma Client 생성
- `db:migrate`: Product 테이블 생성 및 변경 이력 기록
- `db:seed`: 염소탕, 갈비탕, 도가니탕, 우거지 소뼈해장국, LA갈비 추가
- `db:studio`: 브라우저에서 로컬 DB 내용을 확인하는 Prisma Studio 실행

## 4. 개발 서버 실행

```powershell
npm.cmd run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 또는 [http://localhost:3000/products](http://localhost:3000/products)에 접속합니다. `/`는 `/products`로 자동 이동합니다. 서버를 끄려면 터미널에서 `Ctrl+C`를 누릅니다.

배포 서버 없이 내 PC 안에서만 사용하려면 개발 서버가 바인딩되는 기본 주소를 유지하고 공유기 포트포워딩이나 외부 터널을 설정하지 마세요.

## 품질 확인 및 로컬 프로덕션 실행

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd run start
```

`start`는 `build` 성공 후 사용합니다.

### npm 인증서 오류가 발생하는 경우

`UNABLE_TO_VERIFY_LEAF_SIGNATURE`가 표시되면 사내 보안 프로그램이나 프록시의 루트 인증서를 npm이 신뢰하지 못하는 상태입니다. 보안상 `strict-ssl=false`로 우회하지 말고, 조직 또는 보안 프로그램에서 제공한 CA 인증서 파일을 받아 다음처럼 등록한 뒤 다시 설치하세요.

```powershell
npm.cmd config set cafile "C:\인증서경로\company-ca.pem"
npm.cmd install
```

## 주요 폴더

```text
app/                 페이지, 로딩/오류 화면, Server Actions
components/layout/   ERP 사이드바와 헤더
components/products/ 검색, 테이블, 등록/수정/삭제 UI
components/ui/       재사용 가능한 기본 UI
lib/products/        서버 전용 제품 조회 로직
lib/validations/     Zod 입력 검증 규칙
lib/prisma.ts        개발 환경에서도 하나만 생성되는 Prisma Client
prisma/              MySQL 모델과 샘플 데이터
```

추후 재고·거래처·주문 기능은 `app`, `components`, `lib` 아래에 기능별 폴더를 추가하고 `app-sidebar.tsx`의 메뉴 정의를 확장하면 됩니다. 데이터베이스 접근은 Server Component, Server Action 또는 Route Handler 안에서만 수행하세요.
