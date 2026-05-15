# KBO Manager 2026 - Electron 데스크톱 앱

배포 가능한 KBO 야구 매니저 게임의 Electron 기반 데스크톱 애플리케이션입니다.

## 설치 및 실행 방법

### 1단계: Node.js 설치
[Node.js 공식 사이트](https://nodejs.org/)에서 LTS 버전을 설치하세요. (v18 이상 권장)

### 2단계: 프로젝트 의존성 설치
```bash
cd /Users/taekjin/Documents/kbo-manager-electron
npm install
```

### 3단계: 개발 환경에서 실행
```bash
npm run dev
```

이 명령어는 React 개발 서버와 Electron 앱을 동시에 시작합니다.

### 4단계: 앱 빌드 및 배포
```bash
npm run build
```

이 명령어는 다음을 생성합니다:
- **macOS**: `kbo-manager-2026.dmg` (인스톨 파일)
- **Windows**: `kbo-manager-2026.exe` (포터블 실행 파일)
- **Linux**: `kbo-manager-2026.AppImage` (실행 파일)

## 프로젝트 구조

```
kbo-manager-electron/
├── public/
│   ├── electron.js        # Electron 메인 프로세스
│   ├── preload.js         # 보안 컨텍스트 격리
│   └── index.html         # 메인 HTML 파일
├── src/
│   ├── components/        # React 컴포넌트
│   ├── context/          # 게임 상태 관리 (Context API)
│   ├── App.jsx           # 메인 App 컴포넌트
│   ├── App.css           # 글로벌 스타일
│   └── index.js          # React 진입점
├── package.json          # 프로젝트 설정 및 스크립트
└── README.md
```

## 주요 기능

✅ **구단 경영 (타이쿤 모드)**
- 홈 구장 업그레이드
- 팬 마케팅 강화
- 훈련장 시설 업그레이드
- 펀드 투자 시스템

✅ **선수 관리**
- 1군/벤치 로스터 관리
- 자동 라인업 추천
- 선수 피로도 시스템
- FA 이적 시장

✅ **경기 진행**
- 경기 시뮬레이션
- 감독 개입 모드
- 실시간 매치 로그

✅ **리그 관리**
- 팀 순위표
- 개인 기록 순위
- 트레이드 블록

## 배포 후 실행

빌드된 앱은 다음과 같이 배포됩니다:

### macOS
```bash
# DMG 파일을 다운로드하여 더블클릭
# Applications 폴더로 드래그하면 설치 완료
```

### Windows
```bash
# EXE 파일을 다운로드하여 실행
# 설치 마법사에 따라 진행
```

### Linux
```bash
# AppImage 파일을 다운로드하여 실행 권한 부여
chmod +x kbo-manager-2026.AppImage
./kbo-manager-2026.AppImage
```

## 기술 스택

- **Frontend**: React 18
- **Desktop**: Electron
- **State Management**: Context API + useReducer
- **Build Tool**: Electron Builder
- **Styling**: CSS3

## CSV 데이터 포맷

선수 데이터를 CSV로 업로드할 때 다음 포맷을 사용하세요:

```csv
포지션,선수명,팀명,타율,PA,AB,R,H,2B,3B,HR,RBI,TB
투수,김진국,KIA,0.000,0,0,0,0,0,0,0,0,0
포수,박병호,KIA,0.320,400,320,50,102,20,1,15,60,170
```

## 이슈 및 개선

개선 사항이나 버그 보고는 GitHub Issues를 통해 해주세요.

## 라이선스

개인 프로젝트입니다.

---

**마지막 업데이트**: 2026년 5월 14일
