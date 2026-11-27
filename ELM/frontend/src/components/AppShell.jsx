import { NavLink } from "react-router-dom";
import LogoutButton from "./LogoutButton";

const NAV = {
  employee: [
    { to: "/employee", label: "Dashboard", end: true },
    { to: "/employee/apply-leave", label: "Apply Leave" },
  ],
  manager: [
    { to: "/manager", label: "Dashboard", end: true },
    { to: "/manager/apply-leave", label: "Apply Leave" },
  ],
  hr: [{ to: "/hr", label: "Dashboard", end: true }],
};

function AppShell({ title, subtitle, actions, children }) {
  let user = null;
  try { user = JSON.parse(localStorage.getItem("user")); } catch { user = null; }
  const items = NAV[user?.role] || [];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">E</div>
          <div className="brand-name">ELM<small>Leave Management</small></div>
        </div>

        <nav className="nav-wrap">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `nav-link-item ${isActive ? "active" : ""}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="name">{user?.username}</div>
          <div className="meta text-capitalize">
            {user?.role}{user?.department ? ` · ${user.department}` : ""}
          </div>
          <LogoutButton />
        </div>
      </aside>

      <main className="content">
        <div className="page-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}

export default AppShell;