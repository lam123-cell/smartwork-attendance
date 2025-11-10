import { Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/auth/Login";
import DashboardAdmin from "@/pages/admin/DashboardAdmin";
import AdminProfile from "@/pages/admin/AdminProfile";
import ReportManagement from "@/pages/admin/ReportManagement";
import EmployeeManagement from "@/pages/admin/EmployeeManagement";
import ShiftManagement from "@/pages/admin/ShiftManagement";
import SystemSettings from "@/pages/admin/SystemSettings";
import EmployeeDashboard from "@/pages/employee/EmployeeDashboard";
import CheckIN from "@/pages/employee/CheckIn";
import AttendanceHistory from "@/pages/employee/AttendanceHistory";
import PersonalReport from "@/pages/employee/PersonalReport";
import EmployeeProfile from "@/pages/employee/EmployeeProfile";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<DashboardAdmin />} />
        <Route path="/employees" element={<EmployeeManagement />} />
        <Route path="/profile" element={<AdminProfile />} />
        <Route path="/reports" element={<ReportManagement />} />
        <Route path="/shifts" element={<ShiftManagement />} />
        <Route path="/settings" element={<SystemSettings />} />

        {/* Employee Routes */}
        <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
        <Route path="/checkin" element={<CheckIN />} />
        <Route path="/history" element={<AttendanceHistory />} />
        <Route path="/personal-report" element={<PersonalReport />} />
        <Route path="/employee-profile" element={<EmployeeProfile />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;


