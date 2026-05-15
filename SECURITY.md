# 보안 정책 문서

## 개요
KBO Manager 2026은 사용자 데이터 보호와 애플리케이션 보안을 위해 다층 보안 전략을 구현했습니다.

---

## 1. 개발자 도구 (DevTools) 보안

### 설정
- **프로덕션 환경**: DevTools 비활성화
- **개발 환경**: `--dev` 플래그로만 활성화 가능

### 실행 방법
```bash
# 개발 모드 (DevTools 활성화)
npm run dev

# 프로덕션 모드 (DevTools 비활성화)
npm start
```

**목적**: 민감한 데이터와 소스 코드 노출 방지

---

## 2. Content Security Policy (CSP)

### 구현
`public/index.html`에 다음 정책 적용:

```html
<meta http-equiv="Content-Security-Policy" 
  content="default-src 'self'; 
           script-src 'self'; 
           style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
           font-src 'self' https://fonts.gstatic.com; 
           img-src 'self' data:; 
           connect-src 'self';">
```

### 보호 범위
- XSS (Cross-Site Scripting) 공격 방지
- 외부 스크립트 자동 로드 방지
- 인라인 스크립트 실행 차단 (필수 경우만 허용)

---

## 3. Electron 보안 설정

### WebPreferences 구성
```javascript
webPreferences: {
  preload: path.join(__dirname, 'preload.js'),
  nodeIntegration: false,        // Node.js API 접근 차단
  contextIsolation: true,        // 프로세스 격리
  enableRemoteModule: false,     // 원격 모듈 차단
  sandbox: true,                 // 샌드박스 활성화
  webSecurity: true,             // 웹 보안 활성화
  allowRunningInsecureContent: false, // 보안되지 않은 콘텐츠 차단
}
```

### 각 설정의 역할
- **nodeIntegration: false** - 렌더러 프로세스에서 Node.js API 사용 방지
- **contextIsolation: true** - 메인과 렌더러 프로세스 완전 격리
- **sandbox: true** - 렌더러 프로세스에 OS 레벨 제한 적용
- **webSecurity: true** - 동일 출처 정책(SOP) 강제

---

## 4. XSS 방지

### 구현된 보안 함수
`src/utils/security.js` 참고

#### escapeHTML(text)
- HTML 특수 문자를 이스케이프 처리
- 사용자 입력이 화면에 표시될 때 스크립트 실행 방지

#### validateUserInput(input, maxLength)
- 입력값 길이 검증 (기본값: 100자)
- XSS 패턴 자동 감지
- 위험한 태그 및 속성 차단

#### 사용 예시
```javascript
import { escapeHTML, validateUserInput } from '../utils/security';

// 사용자 입력 검증
if (validateUserInput(teamName)) {
  const safeName = escapeHTML(teamName);
  // 안전한 데이터 처리
}
```

---

## 5. 데이터 저장 보안

### LocalStorage 안전 접근
```javascript
import { safeLocalStorage, safeLocalStorageGet } from '../utils/security';

// 데이터 저장
safeLocalStorage('gameState', gameData);

// 데이터 읽기
const savedData = safeLocalStorageGet('gameState');
```

### 주의사항
- **민감한 정보 금지**: 비밀번호, 토큰, API 키 절대 저장 금지
- **현재 안전한 데이터**: 게임 진행 상태, 팀 정보, 통계 데이터

---

## 6. SQL 인젝션 방지

### 현재 상태
- **해당 없음**: 이 애플리케이션은 데이터베이스를 사용하지 않음
- CSV 파일에서만 데이터 로드

### 향후 데이터베이스 추가 시
1. Parameterized Queries 사용
2. ORM 라이브러리 (TypeORM, Prisma) 활용
3. 입력값 유효성 검증 필수

---

## 7. 관리자 계정 보안

### 현재 상태
- **해당 없음**: 관리자 계정 시스템 없음
- 싱글플레이어 게임으로 모든 사용자가 동등한 권한 보유

### 향후 온라인 기능 추가 시
1. 비밀번호 해싱 (bcrypt, argon2 사용)
2. JWT 또는 세션 토큰 사용
3. 계정 잠금 정책 구현 (5회 실패 후 잠금)
4. 2FA (Two-Factor Authentication) 고려

---

## 8. 네트워크 보안

### 현재 상태
- 외부 네트워크 통신 없음 (로컬 게임)

### 향후 온라인 기능 추가 시
1. HTTPS/TLS 필수
2. API 요청 서명 (HMAC)
3. Rate Limiting 구현
4. CORS 정책 설정

---

## 9. 파일 시스템 보안

### 현재 구현
- 데이터 저장: LocalStorage (기본)
- CSV 파일 로드: 로컬 경로만 허용

### 주의사항
- 사용자 입력으로 파일 경로 생성 금지
- 상대 경로 사용으로 디렉토리 traversal 공격 방지

---

## 10. 배포 전 체크리스트

- [ ] DevTools 프로덕션에서 비활성화 확인
- [ ] CSP 헤더 적용 확인
- [ ] 민감한 정보가 소스코드에 노출되지 않음 확인
- [ ] npm 의존성 보안 취약점 확인: `npm audit`
- [ ] 모든 사용자 입력이 검증됨 확인
- [ ] 외부 리소스 로드가 필요한 경우 HTTPS 사용 확인
- [ ] 테스트 코드 및 보안 테스트 실행
- [ ] 서명된 설치 파일 생성 (macOS Code Signing)

---

## 11. 정기적인 보안 유지보수

### 월간 작업
```bash
# 의존성 보안 취약점 검사
npm audit

# 의존성 업데이트
npm update
```

### 분기별 작업
- Electron 최신 버전 확인 및 업데이트
- 보안 정책 검토 및 업데이트
- 소스 코드 보안 감시

---

## 참고 자료

- [Electron 보안](https://www.electronjs.org/docs/tutorial/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Node.js 보안 체크리스트](https://nodejs.org/en/docs/guides/security/)

