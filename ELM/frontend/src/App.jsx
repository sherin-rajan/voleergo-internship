import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/auth/Login";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import HRDashboard from "./pages/hr/HRDashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import ApplyLeave from "./pages/employee/ApplyLeave";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={["manager"]}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr"
          element={
            <ProtectedRoute allowedRoles={["hr"]}>
              <HRDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/apply-leave"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <ApplyLeave />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;