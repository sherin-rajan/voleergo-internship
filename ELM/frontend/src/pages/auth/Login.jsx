import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("token/", {
        username,
        password,
      });

      localStorage.setItem("access", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);

      const userResponse = await api.get("accounts/me/");
      const role = userResponse.data.role;

      localStorage.setItem("user", JSON.stringify(userResponse.data));

      if (role === "employee") {
        navigate("/employee");
      } else if (role === "manager") {
        navigate("/manager");
      } else if (role === "hr") {
        navigate("/hr");
      } else {
        setError("Invalid user role.");
      }
    } catch (err) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("user");
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="login-wrap">
    <div className="login-side">
      <div className="brand">
        <div className="brand-mark">E</div>
        <div className="brand-name">ELM<small>Leave Management</small></div>
      </div>
      <div>
        <h2>Plan time off. Keep the team moving.</h2>
        <p>Requests, approvals and balances, one calm dashboard for everyone.</p>
      </div>
      <small style={{ opacity: 0.6 }}>Employee Leave Management System</small>
    </div>

    <div className="login-main">
      <div className="login-box">
        <h3>Welcome back</h3>
        <p className="mb-4">Sign in to continue.</p>

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input type="text" className="form-control" value={username}
              onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" value={password}
              onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  </div>
);
}

export default Login;
