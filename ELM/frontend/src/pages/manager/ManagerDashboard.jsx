import { useEffect, useState } from "react";
import api from "../../services/api";
import LogoutButton from "../../components/LogoutButton";

function ManagerDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await api.get("leaves/manager/requests/");
        setRequests(
          Array.isArray(response.data)
            ? response.data
            : response.data.results || []
        );
      } catch (err) {
        setError("Unable to load leave requests.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Manager Dashboard</h2>
          <p>Welcome, {user?.username}!</p>
          <p>Department: {user?.department}</p>
        </div>
        <LogoutButton />
      </div>

      <h4 className="mb-3">Pending Leave Requests</h4>

      {loading ? (
        <p>Loading requests...</p>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : requests.length === 0 ? (
        <div className="alert alert-info">
          No pending leave requests.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead className="table-dark">
              <tr>
                <th>Employee</th>
                <th>Employee ID</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Total Days</th>
                <th>Reason</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>{request.employee_name}</td>
                  <td>{request.employee_id}</td>
                  <td>{request.leave_type_name}</td>
                  <td>{request.start_date}</td>
                  <td>{request.end_date}</td>
                  <td>{request.total_days}</td>
                  <td>{request.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ManagerDashboard;
