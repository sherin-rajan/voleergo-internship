import { useEffect, useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import LeaveCalendar from "../../components/LeaveCalendar";
import AppShell from "../../components/AppShell";

const statusClass = (status) =>
  status === "approved" ? "bg-success" : status === "rejected" ? "bg-danger" : "bg-warning";
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
  <AppShell
    title="Manager Dashboard"
    subtitle={`Welcome, ${user?.username} · ${user?.department ?? ""}`}
    actions={
      <button className="btn btn-accent" onClick={() => navigate("/manager/apply-leave")}>
        + Apply Leave
      </button>
    }
  >
    {message && <div className="alert alert-success">{message}</div>}
    {error && <div className="alert alert-danger">{error}</div>}

    {/* Approvals first */}
    <div className="panel panel-flush mb-4">
      <div className="panel-title"><h5>Pending Leave Requests</h5><span className="sub">{requests.length} waiting</span></div>

      {loading ? (
        <div className="empty">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="empty">No pending leave requests.</div>
      ) : (
        <div className="mt-2">
          {requests.map((request) => (
            <div className="request-card" key={request.id}>
              <div className="who">
                <strong>{request.employee_name}</strong>
                <small>{request.employee_id}</small>
              </div>

              <div className="when">
                <span className="chip">{request.leave_type_name}</span>
                <div><small>{request.start_date} → {request.end_date} · {request.total_days} days</small></div>
              </div>

              <div>
                <small className="text-muted fw-bold">REASON</small>
                <p className="reason mt-0">{request.reason}</p>
              </div>

              <textarea
                className="form-control"
                rows="2"
                value={comments[request.id] || ""}
                onChange={(e) =>
                  setComments((previous) => ({ ...previous, [request.id]: e.target.value }))
                }
                placeholder="Optional comment"
              />

              <div className="actions">
                <button className="btn btn-success btn-sm" disabled={reviewingId !== null}
                  onClick={() => handleReview(request.id, "approved")}>
                  {reviewingId === request.id ? "Processing..." : "Approve"}
                </button>
                <button className="btn btn-soft-danger btn-sm" disabled={reviewingId !== null}
                  onClick={() => handleReview(request.id, "rejected")}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Big calendar + my balance */}
    <div className="row g-4 mb-4">
      <div className="col-xl-8">
        <LeaveCalendar />
      </div>

      <div className="col-xl-4">
        <div className="panel">
          <div className="panel-title"><h5>My Leave Balance</h5></div>
          {myDataLoading ? (
            <p>Loading balances...</p>
          ) : (
            balances.map((b, index) => {
              const pct = b.allocated_days ? Math.min(100, (b.used_days / b.allocated_days) * 100) : 0;
              return (
                <div className="balance-row" key={index}>
                  <div className="top"><span>{b.leave_type}</span><span>{b.remaining_days} left</span></div>
                  <div className="meter"><span style={{ width: `${pct}%` }} /></div>
                  <small>Used {b.used_days} of {b.allocated_days}</small>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>

    {/* My history, full width */}
    <div className="panel panel-flush">
      <div className="panel-title"><h5>My Leave History</h5><span className="sub">{myRequests.length} total</span></div>

      {myDataLoading ? (
        <div className="empty">Loading leave history...</div>
      ) : myRequests.length === 0 ? (
        <div className="empty">No leave history found.</div>
      ) : (
        <div className="table-responsive scroll-y mt-3">
          <table className="table data-table">
            <thead>
              <tr><th>Leave Type</th><th>Start Date</th><th>End Date</th><th>Days</th><th>Status</th></tr>
            </thead>
            <tbody>
              {myRequests.map((request) => (
                <tr key={request.id}>
                  <td><b>{request.leave_type_name || request.leave_type}</b></td>
                  <td>{request.start_date}</td>
                  <td>{request.end_date}</td>
                  <td>{request.total_days}</td>
                  <td><span className={`badge ${statusClass(request.status)}`}>{request.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </AppShell>
);
}

export default ManagerDashboard;
