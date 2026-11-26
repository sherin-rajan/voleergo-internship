import { Navigate } from "react-router-dom";

function ProtectedRoute({ allowedRoles, children }) {
  const token = localStorage.getItem("access");
  const userData = localStorage.getItem("user");

  if (!token || !userData) {
    return <Navigate to="/" replace />;
  }

  const user = JSON.parse(userData);

  if (!allowedRoles.includes(user.role)) {
    if (user.role === "employee") {
      return <Navigate to="/employee" replace />;
    }

    if (user.role === "manager") {
      return <Navigate to="/manager" replace />;
    }

    if (user.role === "hr") {
      return <Navigate to="/hr" replace />;
    }

    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;