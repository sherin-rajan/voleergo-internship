import { useEffect, useState } from "react";
import api from "../../services/api";
import LeaveCalendar from "../../components/LeaveCalendar";
import AppShell from "../../components/AppShell";

const months = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December"
];

function HRDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState([]);
  const [departmentReport, setDepartmentReport] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingRequests, setPendingRequests] = useState([]);
  const [comments, setComments] = useState({});
  const [reviewingId, setReviewingId] = useState(null);
  const [actionMessage, setActionMessage] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        dashboardRes,
        monthlyRes,
        departmentRes,
        requestsRes
      ] = await Promise.all([
        api.get("leaves/hr/dashboard/"),
        api.get("leaves/hr/reports/monthly/", {
          params: { year }
        }),
        api.get("leaves/hr/reports/departments/"),
        api.get("leaves/manager/requests/")
      ]);

      setDashboard(dashboardRes.data);
      setMonthlyReport(monthlyRes.data.monthly_report);
      setDepartmentReport(departmentRes.data.department_report);
      setPendingRequests(requestsRes.data);

    } catch (err) {
      console.error(err);
      setError("Unable to load HR dashboard information.");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId, decision) => {
    try {
      setReviewingId(requestId);
      setActionMessage("");

      const response = await api.patch(
        `leaves/manager/requests/${requestId}/review/`,
        {
          status: decision,
          manager_comment: comments[requestId] || ""
        }
      );

      setPendingRequests((previous) =>
        previous.filter((item) => item.id !== requestId)
      );

      setActionMessage(response.data.message || "Request reviewed successfully.");

    } catch (err) {
      setActionMessage(
        err.response?.data?.detail || "Unable to review request."
      );
    } finally {
      setReviewingId(null);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [year]);

    if (loading) {
    return (
      <AppShell title="HR Dashboard">
        <p>Loading dashboard...</p>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="HR Dashboard">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-primary" onClick={loadDashboard}>Retry</button>
      </AppShell>
    );
  }

  const cards = [
    { title: "Total Employees", value: dashboard.total_employees, tone: "tone-ink" },
    { title: "Departments", value: dashboard.total_departments, tone: "" },
    { title: "Pending", value: dashboard.pending_requests, tone: "tone-accent" },
    { title: "Approved", value: dashboard.approved_requests, tone: "tone-success" },
    { title: "Rejected", value: dashboard.rejected_requests, tone: "tone-danger" },
  ];

  return (
    <AppShell title="HR Dashboard" subtitle="Overview of employee leave management">
      <div className="row g-3 mb-4">
        {cards.map((card) => (
          <div className="col-6 col-md-4 col-xl" key={card.title}>
            <div className={`stat-tile ${card.tone}`}>
              <div className="label">{card.title}</div>
              <div className="value">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4 mb-4">
        <div className="col-xl-8">
          <LeaveCalendar />
        </div>

        <div className="col-xl-4">
          <div className="panel panel-flush">
            <div className="panel-title"><h5>Department Summary</h5><span className="sub">headcount</span></div>
            <div className="table-responsive scroll-y mt-3">
              <table className="table data-table">
                <thead>
                  <tr><th>Department</th><th className="text-end">Employees</th></tr>
                </thead>
                <tbody>
                  {dashboard.department_summary.map((item, index) => (
                    <tr key={index}>
                      <td><b>{item.department}</b></td>
                      <td className="text-end">{item.total_employees}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="panel panel-flush mb-4">
        <div className="panel-title"><h5>Pending Manager Leave Requests</h5><span className="sub">{pendingRequests.length} waiting</span></div>

        {actionMessage && <div className="alert alert-info mx-4 mt-3 mb-0">{actionMessage}</div>}

        {pendingRequests.length === 0 ? (
          <div className="empty">No pending manager requests.</div>
        ) : (
          <div className="mt-2">
            {pendingRequests.map((request) => (
              <div className="request-card" key={request.id}>
                <div className="who">
                  <strong>{request.employee_name}</strong>
                  <small>{request.employee_id} · {request.department}</small>
                </div>

                <div className="when">
                  <span className="chip">{request.leave_type_name}</span>
                  <div><small>{request.start_date} → {request.end_date} · {request.total_days} days</small></div>
                </div>

                <div>
                  <small className="text-muted fw-bold">REASON</small>
                  <p className="reason mt-0">{request.reason}</p>
                </div>

                <input
                  type="text"
                  className="form-control"
                  placeholder="Optional comment"
                  value={comments[request.id] || ""}
                  onChange={(e) => setComments({ ...comments, [request.id]: e.target.value })}
                />

                <div className="actions">
                  <button className="btn btn-success btn-sm" disabled={reviewingId === request.id}
                    onClick={() => handleReview(request.id, "approved")}>Approve</button>
                  <button className="btn btn-soft-danger btn-sm" disabled={reviewingId === request.id}
                    onClick={() => handleReview(request.id, "rejected")}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel panel-flush mb-4">
        <div className="panel-title">
          <h5>Monthly Leave Report</h5>
          <select className="form-select" style={{ width: "120px" }} value={year}
            onChange={(e) => setYear(Number(e.target.value))}>
            {[2025, 2026, 2027].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="table-responsive mt-3">
          <table className="table data-table">
            <thead>
              <tr><th>Month</th><th>Total</th><th>Pending</th><th>Approved</th><th>Rejected</th><th>Approved Leave Days</th></tr>
            </thead>
            <tbody>
              {monthlyReport.map((item) => (
                <tr key={item.month}>
                  <td><b>{months[item.month - 1]}</b></td>
                  <td>{item.total_requests}</td>
                  <td>{item.pending_requests}</td>
                  <td>{item.approved_requests}</td>
                  <td>{item.rejected_requests}</td>
                  <td>{item.approved_leave_days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel panel-flush">
        <div className="panel-title"><h5>Department-wise Leave Report</h5></div>
        <div className="table-responsive mt-3">
          <table className="table data-table">
            <thead>
              <tr><th>Department</th><th>Employees</th><th>Total Requests</th><th>Pending</th><th>Approved</th><th>Rejected</th><th>Approved Leave Days</th></tr>
            </thead>
            <tbody>
              {departmentReport.map((item, index) => (
                <tr key={index}>
                  <td><b>{item.department}</b></td>
                  <td>{item.total_employees}</td>
                  <td>{item.total_requests}</td>
                  <td>{item.pending_requests}</td>
                  <td>{item.approved_requests}</td>
                  <td>{item.rejected_requests}</td>
                  <td>{item.approved_leave_days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

export default HRDashboard;
