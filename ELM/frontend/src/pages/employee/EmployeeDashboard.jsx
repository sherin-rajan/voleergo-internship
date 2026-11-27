import { useEffect, useState } from "react";
import api from "../../services/api";
import { useNavigate, useLocation } from "react-router-dom";
import LeaveCalendar from "../../components/LeaveCalendar";
import AppShell from "../../components/AppShell";

const statusClass = (status) =>
  status === "approved" ? "bg-success" : status === "rejected" ? "bg-danger" : "bg-warning";
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
    (total, item) => total + item.allocated_days,
    0
  );

  const totalUsed = balances.reduce(
    (total, item) => total + item.used_days,
    0
  );

  const totalRemaining = balances.reduce(
    (total, item) => total + item.remaining_days,
    0
  );
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
  <AppShell
    title={`Hello, ${user?.username}`}
    subtitle={`Employee ID ${user?.employee_id ?? "-"} · ${user?.department ?? ""}`}
    actions={
      <button className="btn btn-accent" onClick={() => navigate("/employee/apply-leave")}>
        + Apply for Leave
      </button>
    }
  >
    {message?.success && <div className="alert alert-success">{message.success}</div>}
    {message?.error && <div className="alert alert-danger">{message.error}</div>}

    {loading ? (
      <p>Loading dashboard...</p>
    ) : error ? (
      <div className="alert alert-danger">{error}</div>
    ) : (
      <>
        <div className="row g-3 mb-4">
          <div className="col-6 col-xl-3"><div className="stat-tile tone-ink"><div className="label">Allocated</div><div className="value">{totalAllocated}<small>days</small></div></div></div>
          <div className="col-6 col-xl-3"><div className="stat-tile tone-accent"><div className="label">Used</div><div className="value">{totalUsed}<small>days</small></div></div></div>
          <div className="col-6 col-xl-3"><div className="stat-tile tone-success"><div className="label">Remaining</div><div className="value">{totalRemaining}<small>days</small></div></div></div>
          <div className="col-6 col-xl-3"><div className="stat-tile"><div className="label">Pending requests</div><div className="value">{pendingCount}</div></div></div>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-xl-8">
            <LeaveCalendar />
          </div>

          <div className="col-xl-4">
            <div className="panel">
              <div className="panel-title"><h5>Leave Balances</h5><span className="sub">by type</span></div>
              {balances.length === 0 && <p className="mb-0">No balances found.</p>}
              {balances.map((b) => {
                const pct = b.allocated_days ? Math.min(100, (b.used_days / b.allocated_days) * 100) : 0;
                return (
                  <div className="balance-row" key={b.id || b.leave_type}>
                    <div className="top"><span>{b.leave_type}</span><span>{b.remaining_days} left</span></div>
                    <div className="meter"><span style={{ width: `${pct}%` }} /></div>
                    <small>Used {b.used_days} of {b.allocated_days}</small>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="panel panel-flush">
          <div className="panel-title"><h5>My Leave Requests</h5><span className="sub">{requests.length} total</span></div>

          {requests.length === 0 ? (
            <div className="empty">No leave requests found.</div>
          ) : (
            <div className="table-responsive scroll-y mt-3">
              <table className="table data-table">
                <thead>
                  <tr><th>Leave Type</th><th>Start Date</th><th>End Date</th><th>Days</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td><b>{request.leave_type}</b></td>
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
      </>
    )}
  </AppShell>
);
}

export default EmployeeDashboard;
