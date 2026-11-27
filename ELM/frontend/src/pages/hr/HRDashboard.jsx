import { useEffect, useState } from "react";
import api from "../../services/api";
import LogoutButton from "../../components/LogoutButton";
import LeaveCalendar from "../../components/LeaveCalendar";

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
    return <div className="container mt-5">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-primary" onClick={loadDashboard}>
          Retry
        </button>
      </div>
    );
  }

  const cards = [
    { title: "Total Employees", value: dashboard.total_employees },
    { title: "Departments", value: dashboard.total_departments },
    { title: "Pending Requests", value: dashboard.pending_requests },
    { title: "Approved Requests", value: dashboard.approved_requests },
    { title: "Rejected Requests", value: dashboard.rejected_requests }
  ];

  return (
    <div className="container-fluid p-4">
      <h2 className="mb-1">HR Dashboard</h2>
      <p className="text-muted mb-4">
        Overview of employee leave management
      </p>
      <LogoutButton />
      <LeaveCalendar />

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        {cards.map((card, index) => (
          <div className="col-md-4 col-lg" key={index}>
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <p className="text-muted mb-2">{card.title}</p>
                <h3 className="fw-bold">{card.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Department Summary */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="mb-3">Department Summary</h5>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Total Employees</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.department_summary.map((item, index) => (
                  <tr key={index}>
                    <td>{item.department}</td>
                    <td>{item.total_employees}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="mb-3">Pending Manager Leave Requests</h5>

          {actionMessage && (
            <div className="alert alert-info">{actionMessage}</div>
          )}

          {pendingRequests.length === 0 ? (
            <p className="text-muted">No pending manager requests.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Manager</th>
                    <th>Department</th>
                    <th>Leave Type</th>
                    <th>Dates</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Comment</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {pendingRequests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        {request.employee_name}
                        <br />
                        <small className="text-muted">
                          {request.employee_id}
                        </small>
                      </td>

                      <td>{request.department}</td>
                      <td>{request.leave_type_name}</td>

                      <td>
                        {request.start_date}
                        <br />
                        to {request.end_date}
                      </td>

                      <td>{request.total_days}</td>
                      <td>{request.reason}</td>

                      <td>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Optional comment"
                          value={comments[request.id] || ""}
                          onChange={(e) =>
                            setComments({
                              ...comments,
                              [request.id]: e.target.value
                            })
                          }
                        />
                      </td>

                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-success btn-sm"
                            disabled={reviewingId === request.id}
                            onClick={() => handleReview(request.id, "approved")}
                          >
                            Approve
                          </button>

                          <button
                            className="btn btn-danger btn-sm"
                            disabled={reviewingId === request.id}
                            onClick={() => handleReview(request.id, "rejected")}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Report */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Monthly Leave Report</h5>

            <select
              className="form-select"
              style={{ width: "120px" }}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {[2025, 2026, 2027].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Total</th>
                  <th>Pending</th>
                  <th>Approved</th>
                  <th>Rejected</th>
                  <th>Approved Leave Days</th>
                </tr>
              </thead>
              <tbody>
                {monthlyReport.map((item) => (
                  <tr key={item.month}>
                    <td>{months[item.month - 1]}</td>
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
      </div>

      {/* Department Leave Report */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="mb-3">Department-wise Leave Report</h5>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Employees</th>
                  <th>Total Requests</th>
                  <th>Pending</th>
                  <th>Approved</th>
                  <th>Rejected</th>
                  <th>Approved Leave Days</th>
                </tr>
              </thead>
              <tbody>
                {departmentReport.map((item, index) => (
                  <tr key={index}>
                    <td>{item.department}</td>
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
      </div>
    </div>
  );
}

export default HRDashboard;
