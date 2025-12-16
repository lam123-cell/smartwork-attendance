# SmartWork Attendance System

**Xây dựng hệ thống Web quản lý chấm công nhân viên cho các doanh nghiệp vừa và nhỏ**

---

## 🧭 Mô tả ngắn
Đề tài nhằm xây dựng hệ thống Web giúp các doanh nghiệp vừa và nhỏ có thể quản lý chấm công nhân viên một cách hiệu quả, minh bạch và có khả năng mở rộng.  

Hệ thống cho phép nhân viên **check-in / check-out trực tuyến**, tự động tính tổng giờ làm, lưu lịch sử chấm công, và cho phép quản trị viên **tra cứu, thống kê, xuất báo cáo**.  

- **Frontend:** React (Vite) + Tailwind CSS  
- **Backend:** Node.js + Express  
- **Database & Auth:** Supabase (Postgres, Auth, Storage)

---

## 🏗️ Kiến trúc hệ thống

Dự án **SmartWork Attendance System** được phát triển theo mô hình **client–server hai tầng (2-tier)**, gồm:

- **Frontend (Client):** Ứng dụng **ReactJS** hiển thị giao diện người dùng, gửi request API và hiển thị dữ liệu trả về.  
- **Backend (Server):** Ứng dụng **Node.js/Express** xử lý logic nghiệp vụ, xác thực người dùng, và tương tác với cơ sở dữ liệu **PostgreSQL** thông qua **Supabase**.

---

## ⚙️ Kiến trúc Backend

Backend áp dụng mô hình **Three-Layer Architecture**, giúp mã nguồn dễ mở rộng, bảo trì và kiểm thử:

### 🔹 Routes Layer – `src/routes/`
- Định nghĩa các endpoint **RESTful API** (Auth, Employee, Attendance, Admin).  
- Chuyển tiếp request đến controller tương ứng.

### 🔹 Controllers Layer – `src/controllers/`
- Xử lý yêu cầu từ client.  
- Thực hiện kiểm tra dữ liệu đầu vào và gọi service phù hợp.  
- Trả về kết quả **JSON** cho frontend.

### 🔹 Services & Repositories Layer
- `src/services/`: Xử lý **logic nghiệp vụ** (check-in/out, thống kê, xác thực, báo cáo...).  
- `src/repositories/`: Làm việc trực tiếp với cơ sở dữ liệu **Supabase/PostgreSQL**.

### 🔹 Các module hỗ trợ
- `middlewares/`: Xử lý xác thực JWT, kiểm tra quyền truy cập, xử lý lỗi.  
- `utils/`: Hàm tiện ích (ngày giờ, mã hóa JWT, phản hồi API).  
- `jobs/`: Tác vụ tự động (như tự Check-out cuối ngày).

---

## 🎨 Kiến trúc Frontend

Frontend sử dụng **React (Vite)** + **Tailwind CSS**, tổ chức theo mô hình **component-based architecture**:

- `layouts/`: Các khung giao diện chính (**AdminLayout**, **EmployeeLayout**).  
- `pages/`: Các trang nghiệp vụ (**Login**, **Dashboard**, **Check-in/Check-out**, **Reports**...).  
- `components/`: Thành phần tái sử dụng (**Button**, **Modal**, **Table**, **Chart**...).  
- `services/`: Xử lý gọi API đến backend.  
- `hooks/`: Custom hooks cho logic tái sử dụng (đăng nhập, lấy dữ liệu).  
- `utils/`: Xử lý định dạng, thời gian, và vị trí địa lý.

---

## 🔗 Tóm tắt tổng thể

| Thành phần | Kiến trúc | Vai trò chính |
|-------------|------------|----------------|
| **Frontend** | Component-Based Architecture | Hiển thị giao diện, tương tác với người dùng |
| **Backend** | Three-Layer Architecture | Xử lý logic nghiệp vụ, giao tiếp CSDL |
| **Kiểu giao tiếp** | RESTful API | Kết nối giữa Frontend ↔ Backend |
| **Cơ sở dữ liệu** | Supabase (PostgreSQL) | Lưu trữ dữ liệu chấm công, người dùng, báo cáo |

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
SmartWork-Attendance-System/
│
├─ README.md
├─ LICENSE
├─ .gitignore
│
├─ frontend/
│  ├─ public/
│  ├─ src/
│  │  ├─ app/
│  │  │  ├─ routes.tsx              
│  │  │  └─ App.tsx
│  │  │
│  │  ├─ layouts/
│  │  │  ├─ AdminLayout.tsx         
│  │  │  └─ EmployeeLayout.tsx      
│  │  │
│  │  ├─ pages/
│  │  │  ├─ auth/
│  │  │  │  ├─ Login.tsx
│  │  │  │  └─ Register.tsx
│  │  │  │
│  │  │  ├─ admin/
│  │  │  │  ├─ Dashboard.tsx
│  │  │  │  ├─ Employees.tsx
│  │  │  │  ├─ Reports.tsx
│  │  │  │  └─ AttendanceManager.tsx
│  │  │  │
│  │  │  └─ employee/
│  │  │     ├─ Profile.tsx
│  │  │     ├─ CheckinCheckout.tsx
│  │  │     ├─ AttendanceHistory.tsx
│  │  │     └─ LeaveRequest.tsx
│  │  │
│  │  ├─ components/
│  │  │  ├─ common/
│  │  │  │  ├─ Button.tsx
│  │  │  │  ├─ Modal.tsx
│  │  │  │  ├─ Table.tsx
│  │  │  │  └─ Navbar.tsx
│  │  │  └─ charts/
│  │  │     ├─ AttendanceChart.tsx
│  │  │     └─ SummaryCard.tsx
│  │  │
│  │  ├─ services/
│  │  │  ├─ api.ts
│  │  │  └─ attendanceService.ts
│  │  │
│  │  ├─ hooks/
│  │  │  ├─ useAuth.ts
│  │  │  ├─ useFetch.ts
│  │  │  └─ useAttendance.ts
│  │  │
│  │  ├─ utils/
│  │  │  ├─ date.ts
│  │  │  ├─ geo.ts
│  │  │  └─ format.ts
│  │  │
│  │  ├─ assets/
│  │  │  ├─ icons/
│  │  │  └─ images/
│  │  │
│  │  └─ styles/
│  │     └─ globals.css
│  │
│  ├─ .env.local
│  ├─ package.json
│  └─ README.md
│
└─ backend/
   ├─ src/
   │  ├─ app.ts                    
   │  │
   │  ├─ config/
   │  │  ├─ db.ts                  
   │  │  ├─ env.ts
   │  │  └─ supabase.ts
   │  │
   │  ├─ routes/
   │  │  ├─ auth.routes.ts
   │  │  ├─ employee.routes.ts
   │  │  ├─ attendance.routes.ts
   │  │  └─ admin.routes.ts
   │  │
   │  ├─ controllers/
   │  │  ├─ auth.controller.ts
   │  │  ├─ employee.controller.ts
   │  │  ├─ attendance.controller.ts
   │  │  └─ report.controller.ts
   │  │
   │  ├─ services/
   │  │  ├─ auth.service.ts
   │  │  ├─ employee.service.ts
   │  │  ├─ attendance.service.ts
   │  │  └─ report.service.ts
   │  │
   │  ├─ repositories/
   │  │  ├─ employee.repo.ts
   │  │  ├─ attendance.repo.ts
   │  │  ├─ user.repo.ts
   │  │  └─ report.repots
   │  │
   │  ├─ middlewares/
   │  │  ├─ auth.middleware.ts
   │  │  ├─ error.middleware.ts
   │  │  └─ validation.middleware.ts
   │  │
   │  ├─ utils/
   │  │  ├─ geo.ts
   │  │  ├─ date.utils.ts
   │  │  ├─ jwt.ts
   │  │  └─ response.ts
   │  │
   │  ├─ jobs/
   │  │  └─ attendanceJob.ts       
   │  │
   │  └─ tests/
   │     ├─ auth.test.ts
   │     └─ attendance.test.ts
   │
   ├─ migrations/
   ├─ .env
   ├─ package.json
   └─ README.md
