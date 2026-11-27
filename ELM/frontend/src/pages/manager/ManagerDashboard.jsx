import { useEffect, useState } from "react";
import api from "../../services/api";
import LogoutButton from "../../components/LogoutButton";
import { useNavigate } from "react-router-dom";
import LeaveCalendar from "../../components/LeaveCalendar";

function ManagerDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [requests, setRequests] = useState([]);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [balances, setBalances] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [myDataLoading, setMyDataLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [requestsRes, balancesRes, myRequestsRes] =
          await Promise.all([
            api.get("leaves/manager/requests/"),
            api.get("leaves/my-balances/"),
            api.get("leaves/my-requests/")
          ]);

        setRequests(
          Array.isArray(requestsRes.data)
            ? requestsRes.data
            : requestsRes.data.results || []
        );

        setBalances(balancesRes.data);
        setMyRequests(
          Array.isArray(myRequestsRes.data)
            ? myRequestsRes.data
            : myRequestsRes.data.results || []
        );

      } catch (err) {
        setError("Unable to load dashboard information.");
      } finally {
        setLoading(false);
        setMyDataLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleReview = async (requestId, decision) => {
    setError("");
    setMessage("");
    setReviewingId(requestId);

    try {
      const response = await api.patch(
        `leaves/manager/requests/${requestId}/review/`,
        {
          status: decision,
          manager_comment: comments[requestId] || "",
        }
      );

      setRequests((previous) =>
        previous.filter((request) => request.id !== requestId)
      );

      setMessage(response.data.message);
    } catch (err) {
      const data = err.response?.data;
      const errorMessage = data
        ? Object.values(data).flat().join(" ")
        : "Unable to review leave request.";

      setError(errorMessage);
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Manager Dashboard</h2>
          <p>Welcome, {user?.username}!</p>
          <p>Department: {user?.department}</p>
        </div>
        <LogoutButton />
        <button
          className="btn btn-primary"
          onClick={() => navigate("/manager/apply-leave")}
        >
          Apply Leave
        </button>
      </div>
      <LeaveCalendar />

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h4 className="mb-3">My Leave Balance</h4>

          {myDataLoading ? (
            <p>Loading balances...</p>
          ) : (
            <div className="row g-3">
              {balances.map((balance, index) => (
                <div className="col-md-4" key={index}>
                  <div className="card border h-100">
                    <div className="card-body">
                      <h6>{balance.leave_type}</h6>
                      <h3 className="fw-bold">
                        {balance.remaining_days}
                      </h3>
                      <p className="text-muted mb-0">
                        Remaining days
                      </p>
                      <small>
                        Used: {balance.used_days} / {balance.allocated_days}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card shadow-sm mt-4">
          <div className="card-body">
            <h4 className="mb-3">My Leave History</h4>

            {myDataLoading ? (
              <p>Loading leave history...</p>
            ) : myRequests.length === 0 ? (
              <p className="text-muted">No leave history found.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered table-striped">
                  <thead className="table-dark">
                    <tr>
                      <th>Leave Type</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Days</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {myRequests.map((request) => (
                      <tr key={request.id}>
                        <td>{request.leave_type_name || request.leave_type}</td>
                        <td>{request.start_date}</td>
                        <td>{request.end_date}</td>
                        <td>{request.total_days}</td>
                        <td>
                          <span className={`badge ${
                            request.status === "approved"
                              ? "bg-success"
                              : request.status === "rejected"
                              ? "bg-danger"
                              : "bg-warning text-dark"
                          }`}>
                            {request.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <h4 className="mb-3">Pending Leave Requests</h4>

      {message && (
        <div className="alert alert-success">{message}</div>
      )}

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {loading ? (
        <p>Loading requests...</p>
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
                <th>ID</th>
                <th>Leave Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Manager Comment</th>
                <th>Action</th>
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

                  <td>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={comments[request.id] || ""}
                      onChange={(e) =>
                        setComments((previous) => ({
                          ...previous,
                          [request.id]: e.target.value,
                        }))
                      }
                      placeholder="Optional comment"
                    />
                  </td>

                  <td>
                    <button
                      className="btn btn-success btn-sm mb-2"
                      disabled={reviewingId !== null}
                      onClick={() =>
                        handleReview(request.id, "approved")
                      }
                    >
                      {reviewingId === request.id
                        ? "Processing..."
                        : "Approve"}
                    </button>

                    <button
                      className="btn btn-danger btn-sm"
                      disabled={reviewingId !== null}
                      onClick={() =>
                        handleReview(request.id, "rejected")
                      }
                    >
                      Reject
                    </button>
                  </td>
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
