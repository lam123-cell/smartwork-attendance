import { Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import DashboardAdmin from "@/pages/admin/DashboardAdmin";
import AdminProfile from "@/pages/admin/AdminProfile";
import ReportManagement from "@/pages/admin/ReportManagement";
import EmployeeManagement from "@/pages/admin/EmployeeManagement";
import SystemSettings from "@/pages/admin/SystemSettings";
import EmployeeDashboard from "@/pages/employee/EmployeeDashboard";
import CheckIN from "@/pages/employee/CheckIn";
import AttendanceHistory from "@/pages/employee/AttendanceHistory";
import PersonalReport from "@/pages/employee/PersonalReport";
import EmployeeProfile from "@/pages/employee/EmployeeProfile";
import { Toaster } from "@/components/ui/toaster";
import ProtectedRoute from '@/components/ProtectedRoute';
import AttendanceManagement from "@/pages/admin/AttendanceManagement";

function App() {
  return (
    <>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin Routes (only admin) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <EmployeeManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ReportManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AttendanceManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <SystemSettings />
            </ProtectedRoute>
          }
        />

        {/* Employee Routes (only employee) */}
        <Route
          path="/employee-dashboard"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkin"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <CheckIN />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <AttendanceHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/personal-report"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <PersonalReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee-profile"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <EmployeeProfile />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;


