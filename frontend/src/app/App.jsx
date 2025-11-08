import { Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/auth/Login";
import DashboardAdmin from "@/pages/admin/DashboardAdmin";
import AdminProfile from "@/pages/admin/AdminProfile";
import ReportManagement from "@/pages/admin/ReportManagement";
import EmployeeManagement from "@/pages/admin/EmployeeManagement";
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
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;


