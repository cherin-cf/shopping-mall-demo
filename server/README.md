# Shopping Mall Server

Node.js + Express + MongoDB 기반 쇼핑몰 백엔드 API 서버

## 기술 스택

- **Node.js** - JavaScript 런타임
- **Express** - 웹 프레임워크
- **MongoDB** - NoSQL 데이터베이스
- **Mongoose** - MongoDB ODM

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 값을 설정합니다.

```bash
cp .env.example .env
```

### 3. MongoDB 실행

로컬에 MongoDB가 설치되어 있어야 합니다. MongoDB를 실행해주세요.

### 4. 서버 실행

개발 모드 (nodemon 사용):
```bash
npm run dev
```

프로덕션 모드:
```bash
npm start
```

서버가 `http://localhost:5000`에서 실행됩니다.

## API 엔드포인트

### 상품 (Products)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | 모든 상품 조회 |
| GET | /api/products/:id | 단일 상품 조회 |
| POST | /api/products | 상품 생성 |
| PUT | /api/products/:id | 상품 수정 |
| DELETE | /api/products/:id | 상품 삭제 |

## 프로젝트 구조

```
server/
├── src/
│   ├── config/
│   │   └── db.js           # MongoDB 연결 설정
│   ├── controllers/
│   │   └── product.controller.js
│   ├── models/
│   │   └── product.model.js
│   ├── routes/
│   │   └── product.routes.js
│   └── app.js              # Express 앱 진입점
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

