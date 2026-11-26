import LogoutButton from "../../components/LogoutButton";

function ManagerDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="container mt-5">
         <LogoutButton />
      <h2>Manager Dashboard</h2>
      <p>Welcome, {user?.username}!</p>
      <p>Department: {user?.department}</p>
    </div>
  );
}

export default ManagerDashboard;