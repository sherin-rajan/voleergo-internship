import { useEffect, useState } from "react";
import api from "../services/api";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_CHIPS = 2;

function LeaveCalendar() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get("leaves/calendar/");
        setEvents(response.data);
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
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const toDateString = (day) =>
    [year, String(month + 1).padStart(2, "0"), String(day).padStart(2, "0")].join("-");

  const getEventsForDay = (day) => {
    if (!day) return [];
    const dateString = toDateString(day);
    return events.filter((event) => dateString >= event.start && dateString <= event.end);
  };

  const changeMonth = (value) => {
    setCurrentDate(new Date(year, month + value, 1));
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  const today = new Date();
  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  const chipClass = (event) => {
    const name = event.extendedProps?.employee || "";
    let sum = 0;
    for (const ch of name) sum += ch.charCodeAt(0);
    return `c${(sum % 5) + 1}`;
  };

  return (
    <div className="panel">
      <div className="cal-head">
        <div className="month">
          {currentDate.toLocaleString("en-IN", { month: "long", year: "numeric" })}
        </div>
        <div className="cal-nav">
          <button onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button>
          <button onClick={goToToday}>Today</button>
          <button onClick={() => changeMonth(1)} aria-label="Next month">›</button>
        </div>
      </div>

      {loading ? (
        <p className="small mb-0">Loading calendar...</p>
      ) : error ? (
        <div className="alert alert-danger small mb-0">{error}</div>
      ) : (
        <>
          <div className="cal-weekdays">
            {WEEKDAYS.map((d) => <div key={d}>{d}</div>)}
          </div>

          <div className="cal-grid">
            {days.map((day, index) => {
              if (!day) return <div key={index} className="cal-cell blank" />;

              const dayEvents = getEventsForDay(day);
              const weekday = new Date(year, month, day).getDay();
              const isToday =
                today.getFullYear() === year &&
                today.getMonth() === month &&
                today.getDate() === day;

              return (
                <button
                  type="button"
                  key={index}
                  className={`cal-cell ${weekday === 0 || weekday === 6 ? "weekend" : ""} ${isToday ? "today" : ""} ${selectedDay === day ? "selected" : ""}`}
                  onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                >
                  <span className="num">{day}</span>
                  {dayEvents.slice(0, MAX_CHIPS).map((event, i) => (
                    <span key={i} className={`cal-chip ${chipClass(event)}`}>
                      {event.extendedProps?.employee}
                    </span>
                  ))}
                  {dayEvents.length > MAX_CHIPS && (
                    <span className="cal-more">+{dayEvents.length - MAX_CHIPS} more</span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedDay && (
            <div className="cal-detail">
              <strong>
                {new Date(year, month, selectedDay).toLocaleDateString("en-IN", {
                  weekday: "long", day: "numeric", month: "long",
                })}
              </strong>
              {selectedEvents.length === 0 ? (
                <p className="mb-0 mt-2">No one is on leave this day.</p>
              ) : (
                selectedEvents.map((event, i) => (
                  <div className="item" key={i}>
                    <b>{event.extendedProps.employee}</b>
                    <span>{event.extendedProps.department}</span>
                    <span>{event.extendedProps.leave_type}</span>
                    <span>{event.start} → {event.end}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default LeaveCalendar;