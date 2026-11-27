import { useEffect, useState } from "react";
import api from "../../services/api";
import LogoutButton from "../../components/LogoutButton";
import { useNavigate, useLocation } from "react-router-dom";
import LeaveCalendar from "../../components/LeaveCalendar";

function EmployeeDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state;

  
useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      const [balanceResponse, requestResponse] = await Promise.all([
        api.get("leaves/my-balances/"),
        api.get("leaves/my-requests/"),
      ]);

      setBalances(balanceResponse.data);
      setRequests(requestResponse.data);
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError("Unable to load dashboard information.");
    } finally {
      setLoading(false);
    }
  };

  fetchDashboardData();
}, []);


  const totalAllocated = balances.reduce(
    (total, item) => total + item.allocated_days, 0
  );

  const totalUsed = balances.reduce(
    (total, item) => total + item.used_days, 0
  );

  const totalRemaining = balances.reduce(
    (total, item) => total + item.remaining_days, 0
  );

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Employee Dashboard</h2>
          <p>Welcome, {user?.username}!</p>
        </div>
        <LogoutButton />
      </div>

      <p>
        Employee ID: {user?.employee_id} |
        Department: {user?.department}
      </p>
      {message?.success && (
    <div className="alert alert-success">
        {message.success}
    </div>
    )}
    <LeaveCalendar />

    {message?.error && (
    <div className="alert alert-danger">
        {message.error}
    </div>
    )}
      <button
        className="btn btn-primary mb-4"
        onClick={() => navigate("/employee/apply-leave")}
        >
        Apply for Leave
      </button>

      {loading ? (
        <p>Loading dashboard...</p>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <>
          <h4 className="mb-3">Leave Overview</h4>

          <div className="row mb-4">
            <div className="col-md-4 mb-3">
              <div className="card p-3 shadow-sm">
                <h6>Total Allocated</h6>
                <h3>{totalAllocated} Days</h3>
              </div>
            </div>

            <div className="col-md-4 mb-3">
              <div className="card p-3 shadow-sm">
                <h6>Used Leave</h6>
                <h3>{totalUsed} Days</h3>
              </div>
            </div>

            <div className="col-md-4 mb-3">
              <div className="card p-3 shadow-sm">
                <h6>Remaining Leave</h6>
                <h3>{totalRemaining} Days</h3>
              </div>
            </div>
          </div>

          <h4 className="mb-3">Leave Balances</h4>

          <div className="row mb-4">
            {balances.map((balance) => (
              <div className="col-md-4 mb-3" key={balance.id || balance.leave_type}>
                <div className="card p-3 shadow-sm">
                  <h5>{balance.leave_type}</h5>
                  <p>Allocated: {balance.allocated_days}</p>
                  <p>Used: {balance.used_days}</p>
                  <p>Remaining: {balance.remaining_days}</p>
                </div>
              </div>
            ))}
          </div>

          <h4 className="mb-3">My Leave Requests</h4>

          {requests.length === 0 ? (
            <p>No leave requests found.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>Leave Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Days</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.leave_type}</td>
                      <td>{request.start_date}</td>
                      <td>{request.end_date}</td>
                      <td>{request.total_days}</td>
                      <td>{request.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default EmployeeDashboard;
