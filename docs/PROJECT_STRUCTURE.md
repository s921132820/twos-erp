# ERP 프로젝트 구조

이 문서는 Windows 기반 Electron ERP 프로젝트의 초기 폴더 구조와 각 디렉터리의 역할을 정리합니다.

## 폴더 구조

- electron/
- client/
- server/
- prisma/
- docs/

## 역할

### electron/
Electron 데스크톱 앱 관련 코드와 설정을 담습니다.
- Electron 메인 프로세스
- preload 스크립트
- 앱 아이콘 및 설치 관련 설정
- Electron용 환경 설정

### client/
React + TypeScript + Vite 기반 프론트엔드 뷰 계층입니다.
- UI 컴포넌트
- 페이지 및 라우트
- 상태 관리
- REST API 호출 모듈

### server/
Express 기반 백엔드 API 계층입니다.
- REST API 엔드포인트
- 인증/권한 처리
- 비즈니스 로직
- Prisma 클라이언트와 DB 연결
- 에러 핸들링 및 미들웨어

### prisma/
Prisma ORM 관련 설정을 담습니다.
- Prisma schema
- 마이그레이션
- 시드 데이터

### docs/
프로젝트 문서화 자료를 저장합니다.
- ERD
- API 설계서
- 프로젝트 구조 설명
- 설치 및 배포 가이드
