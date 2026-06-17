# README

## 프로젝트 소개

본 프로젝트는 사용자가 입력한 정보를 바탕으로 AI API를 활용하여 웹페이지 시안을 생성하는 웹 서비스이다. 사용자는 웹사이트 이름, 유형, 디자인 스타일 및 기타 요구사항을 입력할 수 있으며, 생성된 결과를 미리 확인하고 저장할 수 있다.

또한 Firebase Authentication을 활용한 회원가입 및 로그인 기능을 제공하며, Firebase Firestore를 이용하여 생성된 프로젝트를 저장할 수 있도록 구현하였다.

---

## 실행 환경

* Visual Studio Code
* Live Server Extension
* HTML
* Tailwind CSS
* JavaScript
* Firebase Authentication
* Firebase Firestore
* Gemini AI API

---

## 실행 방법

### 1. 프로젝트 다운로드

프로젝트 파일을 다운로드하거나 Git 저장소를 클론한다.

### 2. Gemini API 설정

`js/config.js` 파일에서 Gemini API 키를 입력한다.

Gemini API 키는 Google AI Studio에서 발급받을 수 있다.

https://aistudio.google.com/

예시:

```javascript
const GEMINI_API_KEY = "YOUR_API_KEY";
```

### 3. Firebase 설정

Firebase Console에서 프로젝트를 생성한 후 Firebase 설정 정보를 복사한다.

https://console.firebase.google.com/

`window.firebaseConfig` 객체에 Firebase 설정 정보를 입력한다.

예시:

```javascript
window.firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. 프로젝트 실행

Visual Studio Code에서 프로젝트를 연 후 Live Server를 이용하여 실행한다.

1. Visual Studio Code에서 프로젝트 폴더를 연다.
2. `index.html` 파일을 선택한다.
3. 마우스 오른쪽 버튼을 클릭한 후 **Open with Live Server**를 선택한다.
4. 브라우저에서 생성된 로컬 주소로 접속한다.

※ 본 프로젝트는 JavaScript 모듈을 사용하므로 HTML 파일을 직접 실행하지 않고 Live Server와 같은 로컬 서버 환경에서 실행해야 한다.

---

## 프로젝트 구조

```text
project/
├── js/
│   ├── auth-nav.js
│   ├── builder.js
│   ├── config.js
│   ├── firebase.js
│   ├── login.js
│   ├── navbar.js
│   ├── profile.js
│   └── project-save.js
│
├── templates/
│   ├── template-blog-1.html
│   ├── template-portfolio-1.html
│   ├── template-streaming-1.html
│   └── template-example.html
│
├── index.html
├── builder.html
├── login.html
├── preview.html
├── pricing.html
├── profile.html
└── templates.html
```

---

## 주요 모듈 설명

### auth-nav.js

로그인 상태를 확인하고 네비게이션 영역에 사용자 정보를 표시한다.

### builder.js

사용자 입력을 처리하고 AI API 요청을 생성 및 전송한다.

### config.js

Gemini API 키 및 Firebase 설정 정보를 관리한다.

### firebase.js

Firebase 서비스를 초기화하고 연결을 설정한다.

### login.js

회원가입 및 로그인 기능을 처리한다.

### navbar.js

현재 페이지를 확인하고 네비게이션 메뉴 강조 표시 기능을 수행한다.

### profile.js

저장된 프로젝트 조회, 환영 메시지 표시 및 로그아웃 기능을 처리한다.

### project-save.js

로그인 상태를 확인하고 생성된 프로젝트를 Firebase Firestore에 저장한다.

---

## 주요 기능

1. AI 기반 웹페이지 시안 생성
2. 회원가입 및 로그인 기능
3. 프로젝트 저장 기능
4. 템플릿 카테고리 필터링 기능
5. 반응형 네비게이션 및 모바일 메뉴 제공

---

## 데이터 저장 구조

프로젝트 정보는 Firebase Firestore에 저장된다.

저장되는 주요 데이터는 다음과 같다.

* uid : 사용자 고유 식별자
* email : 사용자 이메일
* title : 프로젝트 제목
* company : 웹사이트 또는 회사 이름
* html : 생성된 HTML 결과
* createdAt : 저장 시간

---

## 참고 사항

* Gemini API 키와 Firebase 설정 정보가 올바르게 입력되어야 정상적으로 동작한다.
* Firebase Authentication 및 Firestore 기능을 사용하기 위해서는 Firebase 프로젝트 설정이 필요하다.
* AI API 응답 속도에 따라 결과 생성 시간이 달라질 수 있다.
