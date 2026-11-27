import { useEffect, useState } from "react";
import api from "../services/api";

function LeaveCalendar() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await api.get("leaves/calendar/");
        setEvents(response.data);
        setError("");
      } catch (err) {
        setError("Unable to load leave calendar.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];

  const getEventsForDay = (day) => {
    if (!day) return [];

    const dateString = [
      year,
      String(month + 1).padStart(2, "0"),
      String(day).padStart(2, "0")
    ].join("-");

    return events.filter(
      (event) =>
        dateString >= event.start &&
        dateString <= event.end
    );
  };

  const changeMonth = (value) => {
    setCurrentDate(new Date(year, month + value, 1));
    setSelectedEvent(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedEvent(null);
  };

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <h4 className="mb-0">Leave Calendar</h4>

          <div className="d-flex flex-wrap align-items-center gap-2">
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={goToToday}
            >
              Today
            </button>

            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => changeMonth(-1)}
            >
              Previous
            </button>

            <h5 className="mb-0">
              {currentDate.toLocaleString("en-IN", {
                month: "long",
                year: "numeric"
              })}
            </h5>

            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => changeMonth(1)}
            >
              Next
            </button>
          </div>
        </div>

        {loading ? (
          <p>Loading calendar...</p>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <>
            <div className="row text-center fw-bold border-bottom pb-2 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (day) => (
                  <div className="col" key={day}>
                    {day}
                  </div>
                )
              )}
            </div>

            <div className="row g-1">
              {days.map((day, index) => {
                const dayEvents = getEventsForDay(day);

                const isToday =
                  day &&
                  new Date().getFullYear() === year &&
                  new Date().getMonth() === month &&
                  new Date().getDate() === day;

                return (
                  <div
                    className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
                    key={index}
                  >
                    <div
                      className={`border rounded p-2 ${
                        isToday ? "border-primary border-2" : ""
                      }`}
                      style={{ minHeight: "110px" }}
                    >
                      {day && (
                        <>
                          <strong
                            className={isToday ? "text-primary" : ""}
                          >
                            {day}
                            {isToday && " (Today)"}
                          </strong>

                          {dayEvents.map((event) => (
                            <button
                              type="button"
                              key={event.id}
                              className="btn btn-primary w-100 text-start p-1 mt-1"
                              style={{
                                fontSize: "11px",
                                overflowWrap: "anywhere"
                              }}
                              onClick={() => setSelectedEvent(event)}
                            >
                              <div>{event.extendedProps.employee}</div>
                              <div>{event.extendedProps.leave_type}</div>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedEvent && (
              <div className="card border-primary mt-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Leave Details</h5>

                    <button
                      type="button"
                      className="btn-close"
                      aria-label="Close"
                      onClick={() => setSelectedEvent(null)}
                    />
                  </div>

                  <p>
                    <strong>Employee:</strong>{" "}
                    {selectedEvent.extendedProps.employee}
                  </p>

                  <p>
                    <strong>Department:</strong>{" "}
                    {selectedEvent.extendedProps.department}
                  </p>

                  <p>
                    <strong>Leave Type:</strong>{" "}
                    {selectedEvent.extendedProps.leave_type}
                  </p>

                  <p>
                    <strong>Start Date:</strong>{" "}
                    {selectedEvent.start}
                  </p>

                  <p className="mb-0">
                    <strong>End Date:</strong>{" "}
                    {selectedEvent.end}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default LeaveCalendar;
