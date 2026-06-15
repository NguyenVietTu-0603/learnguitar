# Playbook xay dung module moi (Learn Guitar)

Tai lieu nay dung de lap lai cung mot quy trinh moi khi mo module moi (vi du: payment, progress, comment, practice-test...).

## 1) Thiet ke dau tien (lam truoc khi code)

### 1.1 Muc tieu nghiep vu
- Module nay giai quyet bai toan gi?
- Nguoi dung nao su dung: student, teacher, admin?
- Ket qua sau cung mong muon tren UI la gi?

### 1.2 Pham vi va gioi han
- Co bao nhieu use case trong dot nay?
- Nhung gi chua lam trong dot nay (out of scope)?

### 1.3 Mo hinh du lieu
- Entity chinh la gi?
- Thuoc tinh bat buoc, optional, unique?
- Quan he voi entity cu (User, Course, Lesson...)?

### 1.4 Hop dong API
- Endpoint can co: GET/POST/PATCH/DELETE?
- Input payload cua moi endpoint
- Output response cua moi endpoint
- Danh sach loi va status code

### 1.5 Rule validate va phan quyen
- Dieu kien validate tren backend
- Role nao duoc phep thao tac endpoint nao

### 1.6 Kich ban test
- 1 happy path
- 2-3 invalid path
- 1 permission path (khong du quyen)

Neu chua ro 6 muc tren, chua nen code.

---

## 2) Thu tu xay dung file Backend (bat buoc theo thu tu)

Duong dan goc backend: learn-guitar-backend/src

### Buoc B1 - Model truoc
1. models/<module>.model.js
- Dinh nghia schema
- Index unique neu can
- Method schema neu can

### Buoc B2 - Validator
2. validators/<module>.validator.js
- Validate payload create/update
- Tach ro create schema va update schema

### Buoc B3 - DTO (neu module phuc tap)
3. dtos/<module>.dto.js
- Chuan hoa output tra ve cho client

### Buoc B4 - Service
4. services/<module>.service.js
- Chua business logic
- KHONG thao tac req/res tai day
- Throw Error ro rang cho cac case loi

### Buoc B5 - Controller
5. controllers/<module>.controller.js
- Nhan req
- Goi service
- Tra response dung format

### Buoc B6 - Route
6. routes/<module>.route.js
- Mapping endpoint -> controller
- Dat ten route theo REST conventions

### Buoc B7 - Dang ky route trong app
7. app.js
- Import route module
- app.use('/api/v1/<module>', moduleRoutes)

### Buoc B8 - Test
8. tests/unit/<module>.service.test.js
9. tests/integration/<module>.api.test.js

Backend chi duoc coi la xong khi:
- Co endpoint chay duoc
- Validate loi dung
- Du lieu luu/lay dung
- Test co it nhat 1 happy + 1 fail case

---

## 3) Thu tu xay dung file Frontend (sau khi backend endpoint on dinh)

Duong dan goc frontend: learn-guitar-frontend/src

### Buoc F1 - Kieu du lieu cho module
1. features/<module>/types.ts
- Khai bao type cho entity, request, response

### Buoc F2 - API client module
2. features/<module>/<module>Api.ts
- Goi endpoint backend thong qua axios instance
- Khong viet UI trong file nay

Neu ban muon dung service chung thi co the dat tai:
- services/<module>Service.ts

### Buoc F3 - State management theo module
3. features/<module>/<module>Context.tsx hoac hooks/<module>/use<Module>.ts
- Quan ly loading/error/data
- Tach logic khoi component UI

### Buoc F4 - Trang/chuc nang UI
4. pages/<Module>Page.tsx hoac features/<module>/components/*.tsx
- Form list/detail/create/edit
- Hien thi loading va error

### Buoc F5 - Router
5. router/AppRoutes.tsx
- Them route cho module
- Bao ve route neu can (ProtectedRoute)

### Buoc F6 - Tich hop dieu huong va UX
6. layouts + components dung chung
- Link dieu huong den page moi
- Toast/alert thong bao thanh cong that bai

Frontend chi duoc coi la xong khi:
- UI goi duoc API that
- Xu ly loading/error day du
- Data render dung
- Chuyen trang dung sau create/update/delete

---

## 4) Format response API chuan de frontend de dung

Nen thong nhat 1 format:
- success: boolean
- message: string
- data: object | array | null

Vi du:
- Thanh cong: { success: true, message: '...', data: ... }
- That bai: { success: false, message: '...', errors?: [...] }

---

## 5) Checklist Definition of Done cho moi module

### Thiet ke
- [ ] Co mo ta nghiep vu
- [ ] Co danh sach endpoint
- [ ] Co schema du lieu
- [ ] Co rule validate

### Backend
- [ ] model xong
- [ ] validator xong
- [ ] service xong
- [ ] controller xong
- [ ] route xong
- [ ] app.js da dang ky route
- [ ] unit/integration test co ket qua

### Frontend
- [ ] types xong
- [ ] api service xong
- [ ] state/hook/context xong
- [ ] page/component xong
- [ ] route da gan vao app
- [ ] UX loading/error/day du

### Dong bo
- [ ] Frontend dung dung endpoint backend
- [ ] Payload frontend khop validator backend
- [ ] Response backend khop type frontend

---

## 6) Mau ke hoach 1 module moi (dien nhanh truoc khi code)

Ten module:

Muc tieu:

Actor:

Entity chinh:

Endpoint list:
- GET /api/v1/<module>
- GET /api/v1/<module>/:id
- POST /api/v1/<module>
- PATCH /api/v1/<module>/:id
- DELETE /api/v1/<module>/:id

File backend se tao/sua theo thu tu:
1) models/<module>.model.js
2) validators/<module>.validator.js
3) services/<module>.service.js
4) controllers/<module>.controller.js
5) routes/<module>.route.js
6) app.js

File frontend se tao/sua theo thu tu:
1) features/<module>/types.ts
2) features/<module>/<module>Api.ts
3) hooks/<module>/use<Module>.ts hoac context
4) pages/<Module>Page.tsx
5) router/AppRoutes.tsx

Test cases toi thieu:
- Happy case:
- Validation fail case:
- Permission fail case:

---

## 7) Nguyen tac quan trong de tranh loi ve sau

- Luon chot API contract truoc khi build UI.
- Khong de business logic o controller.
- Khong de API call truc tiep lung tung trong nhieu component.
- Khong bo qua loading/error state.
- Moi module phai co checklist DoD truoc khi merge.

---

Neu ban muon, o lan tiep theo toi co the tao them 1 template code khung tu dong cho module moi (sinh san cac file model/service/controller/route va frontend types/api/page).
