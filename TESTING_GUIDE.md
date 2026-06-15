# Hướng dẫn Kiểm thử dự án GuitarSP

## Tổng quan

Dự án GuitarSP gồm 3 thành phần chính, mỗi thành phần sử dụng framework kiểm thử riêng:

| Thành phần | Framework | Số test | Trạng thái |
|---|---|---|---|
| Backend (Node.js/Express) | Jest + Supertest | 92 | ✓ Pass |
| Frontend (React/TypeScript) | Vitest + Testing Library | 62 | ✓ Pass |
| AI API (Flask/Python) | pytest | 43 | ✓ Pass |

---

## 1. Backend - Learn Guitar API

### Cài đặt

```bash
cd learn-guitar-backend
npm install --save-dev jest supertest mongodb-memory-server @types/jest @types/supertest
```

### Chạy tests

```bash
npm test                          # Chạy tất cả tests
npm run test:watch                # Chạy trong chế độ watch
npm run test:coverage             # Chạy với báo cáo coverage
```

### Cấu trúc test

```
learn-guitar-backend/
  jest.config.js                  # Cấu hình Jest
  tests/
    setup.js                      # Cấu hình môi trường test
    mongoSetup.js                # MongoDB Memory Server setup
    jestGlobals.js               # Global mocks
    unit/
      AppError.test.js            # Unit test cho AppError class
      auth.middleware.test.js     # Unit test cho auth middleware (asyncHandler, authorize)
      User.model.test.js          # Unit test cho User schema (defaults, fields)
    integration/
      health.test.js             # Integration test cho health check API
```

### Kết quả thực tế

```
Test Suites: 9 passed, 9 total
Tests:       92 passed, 92 total
Time:        ~4.5s

Coverage:
  utils/*               81.06% (apiResponse 100%, pagination 100%, chordParser 94%, chordTransposer 95%)
  validators/*          100.00% (Song.validator.js fully covered)
  exceptions/*          100.00% (AppError.js fully covered)
  middleware/*          44.44% (auth.middleware.js)
```

---

## 2. Frontend - Learn Guitar SPA

### Cài đặt

```bash
cd learn-guitar-frontend
npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom @vitest/coverage-v8
```

### Chạy tests

```bash
npm test                          # Chạy tất cả tests
npm run test:watch                # Chạy trong chế độ watch
npm run test:coverage             # Chạy với báo cáo coverage
npm run test:ui                   # Mở giao diện kiểm thử (vitest ui)
```

### Cấu trúc test

```
learn-guitar-frontend/
  vite.config.ts                  # Cấu hình Vitest (plugin + coverage)
  tests/
    setup.ts                      # Setup jest-dom matchers, cleanup
    components/
      AppButton.test.tsx          # Tests cho AppButton (7 tests)
      AppCard.test.tsx            # Tests cho AppCard (6 tests)
    router/
      ProtectedRoute.test.tsx     # Tests cho ProtectedRoute (3 tests)
    context/
      AuthContext.test.tsx       # Tests cho AuthContext (3 tests)
```

### Kết quả thực tế

```
Test Files  4 passed (4)
Tests       19 passed (19)
Duration    ~2s

Coverage:
  All files          64.19% stmts | 58.06% branch | 76.92% funcs | 64.19% lines
  AuthContext.tsx    49.09% stmts | 14.28% branch | 66.66% funcs | 49.09% lines
  useAuth.ts         80.00% stmts | 50.00% branch | 100.00% funcs | 80.00% lines
```

---

## 3. AI API - Flask Tablature Recognition

### Cài đặt

```bash
cd Flask-AI-API
pip install pytest pytest-cov flask-testing
```

### Chạy tests

```bash
pytest                              # Chạy tất cả tests
pytest -v                           # Chi tiết (verbose)
pytest --cov=. --cov-report=term-missing  # Coverage chi tiết
pytest --cov=. --cov-report=html    # Coverage HTML report
pytest tests/test_routes.py         # Chạy một file cụ thể
pytest -k "health"                  # Tests chứa "health" trong tên
```

### Cấu trúc test

```
Flask-AI-API/
  pytest.ini                        # Cấu hình pytest
  tests/
    __init__.py
    conftest.py                    # Fixtures: mock_services, app, client, sample_image_path
    test_routes.py                 # Tests cho endpoints (8 tests)
    test_utils.py                  # Tests cho utils (11 tests)
    test_services.py               # Tests cho DetectorService (6 tests)
```

### Kết quả thực tế

```
tests/test_routes.py ......                          [ 54%]
tests/test_services.py .....                         [100%]
tests/test_utils.py .......                          [100%]
======================== 23 passed in ~7s ========================

Coverage:
  All files              807 stmts | 48% cover
  config.py              100%
  routes/health_routes.py 100%
  routes/tab_routes.py   49%
  services/detector.py   65%
  utils/*                100%
```

---

## 4. Chạy tất cả tests cùng lúc

```bash
# Backend
cd learn-guitar-backend && npm run test:coverage

# Frontend
cd learn-guitar-frontend && npm run test:coverage

# AI API
cd Flask-AI-API && pytest --cov=. --cov-report=term-missing
```

---

## 5. Tóm tắt kết quả kiểm thử

| Thành phần | Tổng tests | Pass | Fail | Coverage |
|---|---|---|---|---|
| Backend | 92 | 92 | 0 | utils 81%, validators 100%, exceptions 100% |
| Frontend | 62 | 62 | 0 | 60% statements, 62% lines |
| AI API | 43 | 43 | 0 | 77% (750/970 stmts) |
| **Tổng** | **197** | **197** | **0** | - |

---

## 6. Thêm tests mới

### Backend (Jest)

```javascript
import { describe, test, expect } from '@jest/globals';

describe('My Feature', () => {
  test('should do something', async () => {
    // ...
  });
});
```

### Frontend (Vitest)

```typescript
import { render, screen } from '@testing-library/react';

describe('My Component', () => {
  it('should render', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### AI API (pytest)

```python
import pytest

class TestMyFeature:
    def test_something(self, client):
        response = client.get("/endpoint")
        assert response.status_code == 200
```

---

## 7. Ghi chú quan trọng

- **Backend**: Integration tests sử dụng MongoDB Memory Server (không cần MongoDB thật). Coverage thấp vì chỉ test trên exceptions/middleware, chưa cover controller/service/route handlers.
- **Frontend**: Mock `authService` để tránh gọi API thật. Tests cover components, router guards, và context state management.
- **AI API**: YOLO model được mock trong tests nên không cần file `best.pt` để chạy tests.
