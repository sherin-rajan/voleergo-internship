import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div>
      <nav className="public-nav">
        <div className="brand">
          <div className="brand-mark">E</div>
          <div className="brand-name">
            ELM
            <small>Leave Management</small>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/login")}>
          Login
        </button>
      </nav>

      <section className="home-hero">
        <div>
          <h1>
            Time off, <em>sorted</em> without the paperwork.
          </h1>
          <p className="lead">
            Apply for leave, track balances, and move approvals along, all from one place.
          </p>
          <button className="btn btn-accent btn-lg" onClick={() => navigate("/login")}>
            Get Started
          </button>
        </div>

        <div className="home-card">
          <h4>Everything in one view</h4>
          <div className="feat"><b>01</b> Apply for leave online</div>
          <div className="feat"><b>02</b> Track leave balances live</div>
          <div className="feat"><b>03</b> Manager approval workflow</div>
          <div className="feat"><b>04</b> HR reports and team calendar</div>
        </div>
      </section>

      <footer className="public-foot">Employee Leave Management System</footer>
    </div>
  );
}