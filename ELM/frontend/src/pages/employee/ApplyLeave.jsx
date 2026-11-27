
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import AppShell from "../../components/AppShell";

function ApplyLeave() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState([]);

  // Load leave types
  useEffect(() => {
  const fetchData = async () => {
    try {
      const [typeResponse, balanceResponse] = await Promise.all([
        api.get("leaves/types/"),
        api.get("leaves/my-balances/"),
      ]);

      setLeaveTypes(typeResponse.data);
      setBalances(balanceResponse.data);
    } catch (err) {
      setError("Unable to load leave information.");
    }
  };

  fetchData();
}, []);

  // Submit leave application
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("leaves/requests/", {
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason,
      });

      navigate("/employee", {
        state: {
          success: "Leave application submitted successfully!",
        },
      });

    } catch (err) {
      const data = err.response?.data;
      const message = data
        ? Object.values(data).flat().join(" ")
        : "Unable to submit leave application.";

      if (message.includes("at least one working day")) {
        navigate("/employee", {
          state: {
            error: "Unable to submit. The selected dates contain no working days.",
          },
        });

      } else if (message.includes("Insufficient leave balance")) {
        navigate("/employee", {
          state: {
            error: "Unable to submit. You do not have sufficient leave balance for this leave type.",
          },
        });

      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };
 const selectedType = leaveTypes.find(
  (type) => type.id === Number(leaveType)
);

const selectedBalance = balances.find(
  (item) => item.leave_type === selectedType?.name
);

  return (
  <AppShell title="Apply for Leave" subtitle="Fill in the details and submit for approval.">
    <div className="row g-4">
      <div className="col-xl-8">
        <div className="panel">
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-12">
                <label className="form-label">Leave Type</label>
                <select className="form-select" value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)} required>
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label">Start Date</label>
                <input type="date" className="form-control" value={startDate}
                  onChange={(e) => setStartDate(e.target.value)} required />
              </div>

              <div className="col-md-6">
                <label className="form-label">End Date</label>
                <input type="date" className="form-control" value={endDate}
                  onChange={(e) => setEndDate(e.target.value)} required />
              </div>

              <div className="col-12">
                <label className="form-label">Reason</label>
                <textarea className="form-control" rows="5" value={reason}
                  onChange={(e) => setReason(e.target.value)} required />
              </div>
            </div>

            <div className="d-flex gap-2 mt-4">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Submitting..." : "Submit Application"}
              </button>
              <button type="button" className="btn btn-outline-primary"
                onClick={() => navigate(user?.role === "manager" ? "/manager" : "/employee")}>
                Back
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="col-xl-4">
        <div className="apply-note">
          <h6>{selectedType ? `${selectedType.name} balance` : "Leave balance"}</h6>
          {selectedBalance ? (
            <>
              <div className="line"><span>Allocated</span><b>{selectedBalance.allocated_days} days</b></div>
              <div className="line"><span>Used</span><b>{selectedBalance.used_days} days</b></div>
              <div className="line"><span>Remaining</span><b>{selectedBalance.remaining_days} days</b></div>
              {selectedBalance.remaining_days === 0 && (
                <strong className="text-danger d-block mt-2">
                  You have no remaining balance for this leave type.
                </strong>
              )}
            </>
          ) : (
            <p className="mb-0">Pick a leave type to see your balance.</p>
          )}
        </div>
      </div>
    </div>
  </AppShell>
);
}

export default ApplyLeave;
