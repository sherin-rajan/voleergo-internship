
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
    <div className="container min-vh-100 d-flex justify-content-center align-items-center">
      <div className="card shadow p-4" style={{ width: "400px" }}>
        <h3 className="text-center mb-4">
          Employee Leave Management
        </h3>

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="alert alert-danger">{error}</div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
