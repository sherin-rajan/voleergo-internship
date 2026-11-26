import LogoutButton from "../../components/LogoutButton";

function HRDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="container mt-5">
         <LogoutButton />
      <h2>HR Administrator Dashboard</h2>
      <p>Welcome, {user?.username}!</p>
      <p>Company-wide HR Management</p>
    </div>
  );
}

export default HRDashboard;