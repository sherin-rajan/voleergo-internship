import { useNavigate } from "react-router-dom";

function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");

    navigate("/", { replace: true });
  };

  return (
    <button
      className="btn btn-danger"
      onClick={handleLogout}
    >
      Logout
    </button>
  );
}

export default LogoutButton;