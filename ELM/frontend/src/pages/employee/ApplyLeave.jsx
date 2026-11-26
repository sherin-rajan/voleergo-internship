
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function ApplyLeave() {
  const navigate = useNavigate();

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
    <div className="container mt-4">
      <div className="card shadow-sm p-4">
        <h3 className="mb-4">Apply for Leave</h3>

        {error && (
          <div className="alert alert-danger">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Leave Type</label>
            <select
              className="form-select"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              required
            >
              <option value="">Select Leave Type</option>
              {leaveTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {selectedBalance && (
                <div className="alert alert-info mt-2">
                    <p>Allocated: {selectedBalance.allocated_days} days</p>
                    <p>Used: {selectedBalance.used_days} days</p>
                    <p>Remaining: {selectedBalance.remaining_days} days</p>

                    {selectedBalance.remaining_days === 0 && (
                    <strong className="text-danger">
                        You have no remaining balance for this leave type.
                    </strong>
                    )}
                </div>
                )}
          </div>

          <div className="mb-3">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Reason</label>
            <textarea
              className="form-control"
              rows="3"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>

          <button
            type="button"
            className="btn btn-secondary ms-2"
            onClick={() => navigate("/employee")}
          >
            Back
          </button>
        </form>
      </div>
    </div>
  );
}

export default ApplyLeave;
