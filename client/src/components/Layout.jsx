import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, GraduationCap, Users, BookOpen, ClipboardPen, FileCheck2, FileText, Settings, LogOut, Menu, X, Bell, ChevronDown } from "lucide-react";
import { useAppStore } from "../store/useAppStore";

const links = [
  ["/app", "Overview", LayoutDashboard], ["/app/students", "Students", GraduationCap], ["/app/teachers", "Teachers", Users],
  ["/app/subjects", "Classes & subjects", BookOpen], ["/app/scores", "Score entry", ClipboardPen],
  ["/app/results", "Result workflow", FileCheck2], ["/app/reports", "Report cards", FileText], ["/app/settings", "Settings", Settings]
];

export default function Layout() {
  const { user, sidebarOpen, toggleSidebar, closeSidebar, logout } = useAppStore();
  const location = useLocation(); const title = links.find(([path]) => path === location.pathname)?.[1] || "Overview";
  return <div className="app-shell">
    {sidebarOpen && <button className="sidebar-backdrop" onClick={closeSidebar} aria-label="Close navigation" />}
    <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      <div className="brand"><div className="brand-mark">ER</div><div><strong>EduResult</strong><span>Assessment system</span></div><button className="mobile-close" onClick={closeSidebar}><X size={20}/></button></div>
      <div className="school-card"><span>Current school</span><strong>{user.school?.name}</strong><small>{user.school?.activeSession} · {user.school?.activeTerm}</small></div>
      <nav>{links.map(([path, label, Icon]) => <NavLink key={path} end={path === "/app"} to={path} onClick={closeSidebar}><Icon size={19}/><span>{label}</span></NavLink>)}</nav>
      <button className="logout" onClick={logout}><LogOut size={18}/>Sign out</button>
    </aside>
    <main className="main"><header className="topbar"><button className="menu" onClick={toggleSidebar}><Menu size={22}/></button><div><p>School administration</p><h1>{title}</h1></div><div className="top-actions"><button className="icon-button"><Bell size={20}/><i /></button><button className="user-chip"><span>AY</span><div><strong>{user.name}</strong><small>School Admin</small></div><ChevronDown size={16}/></button></div></header><div className="page"><Outlet /></div></main>
  </div>;
}
