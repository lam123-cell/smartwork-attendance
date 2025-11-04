# SmartWork Attendance System

**Xây dựng hệ thống Web quản lý chấm công nhân viên cho Công ty TNHH Dịch vụ & Giải pháp SmartWork Sài Gòn**

---

## 🧭 Mô tả ngắn
Đề tài nhằm xây dựng hệ thống Web giúp Công ty TNHH Dịch vụ & Giải pháp SmartWork Sài Gòn quản lý chấm công nhân viên một cách hiệu quả, minh bạch và có khả năng mở rộng.  

Hệ thống cho phép nhân viên **check-in / check-out trực tuyến**, tự động tính tổng giờ làm, lưu lịch sử chấm công, và cho phép quản trị viên **tra cứu, thống kê, xuất báo cáo**.  

- **Frontend:** React (Vite) + Tailwind CSS  
- **Backend:** Node.js + Express  
- **Database & Auth:** Supabase (Postgres, Auth, Storage)

---

## 🏗️ Kiến trúc đề xuất
- **Pattern:** Layered / Clean Architecture  
  > `Presentation → Application → Domain → Infrastructure`
- **API Style:** RESTful API  
- **Lý do:** Tách biệt rõ ràng các tầng, dễ test, dễ mở rộng (có thể tích hợp thêm GPS/FaceID, thống kê nâng cao, realtime...).

---

## ⚙️ Stack chính
| Thành phần | Công nghệ |
|-------------|------------|
| Frontend | React (Vite), Tailwind CSS, React Router |
| Backend | Node.js, Express |
| Database/Auth | Supabase (Postgres, Auth, Storage, Realtime) |
| DevOps *(tùy chọn)* | Docker, Docker Compose |
| Công cụ phát triển | Git, GitHub, VSCode |

---

## 📁 Cấu trúc thư mục (Skeleton)

```bash
README.md
LICENSE
.gitignore

frontend/
├─ public/
├─ src/
│  ├─ assets/
│  ├─ components/
│  │  ├─ common/
│  │  ├─ auth/
│  │  ├─ attendance/
│  │  └─ admin/
│  ├─ pages/
│  │  ├─ Auth/
│  │  │  └─ Login.jsx
│  │  ├─ Employee/
│  │  │  ├─ Profile.jsx
│  │  │  └─ AttendanceHistory.jsx
│  │  └─ Admin/
│  │     ├─ Dashboard.jsx
│  │     ├─ Employees.jsx
│  │     └─ Reports.jsx
│  ├─ services/
│  │  └─ api.js
│  ├─ hooks/
│  │  ├─ useAuth.js
│  │  └─ useFetchAttendance.js
│  ├─ routes/
│  ├─ utils/
│  │  ├─ date.js
│  │  └─ geo.js
│  ├─ styles/
│  │  └─ globals.css
│  ├─ App.jsx
│  └─ main.jsx
├─ .env.local
├─ package.json
└─ README.md

backend/
├─ src/
│  ├─ controllers/
│  │  ├─ auth.controller.js
│  │  ├─ employee.controller.js
│  │  └─ attendance.controller.js
│  ├─ services/
│  │  ├─ attendance.service.js
│  │  └─ employee.service.js
│  ├─ repositories/
│  │  ├─ attendance.repo.js
│  │  └─ employee.repo.js
│  ├─ middlewares/
│  │  ├─ auth.middleware.js
│  │  └─ error.middleware.js
│  ├─ utils/
│  │  ├─ geo.js
│  │  └─ date.utils.js
│  ├─ routes/
│  │  ├─ auth.routes.js
│  │  └─ attendance.routes.js
│  ├─ jobs/
│  ├─ config/
│  │  ├─ db.js
│  │  └─ supabase.js
│  └─ app.js
├─ migrations/
├─ .env
├─ package.json
└─ README.md
