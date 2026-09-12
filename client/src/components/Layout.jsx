import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, GraduationCap, Users, BookOpen, ClipboardPen, FileCheck2, FileText, Settings, LogOut, Menu, X, Bell, ChevronDown, CalendarRange, ShieldCheck } from "lucide-react";
import { useAppStore } from "../store/useAppStore";

const links = [
  ["/app", "Overview", LayoutDashboard, ["admin","teacher","form_master"]], ["/app/students", "Students", GraduationCap, ["admin","teacher","form_master"]],
  ["/app/teachers", "Teachers", Users, ["admin"]], ["/app/academic", "Academic setup", CalendarRange, ["admin"]],
  ["/app/subjects", "Classes & subjects", BookOpen, ["admin","teacher","form_master"]], ["/app/scores", "Score entry", ClipboardPen, ["admin","teacher","form_master"]],
  ["/app/results", "Result workflow", FileCheck2, ["admin","form_master"]], ["/app/reports", "Report cards", FileText, ["admin","form_master"]],
  ["/app/audit", "Audit trail", ShieldCheck, ["admin"]], ["/app/settings", "Settings", Settings, ["admin"]]
];

export default function Layout() {
  const { user, sidebarOpen, toggleSidebar, closeSidebar, logout } = useAppStore();
  const [profileOpen,setProfileOpen]=useState(false); const profileRef=useRef(null); const navigate=useNavigate();
  useEffect(()=>{const close=e=>{if(!profileRef.current?.contains(e.target))setProfileOpen(false)};document.addEventListener("mousedown",close);return()=>document.removeEventListener("mousedown",close)},[]);
  function signOut(){logout();navigate("/login",{replace:true})}
  const location = useLocation(); const visibleLinks = links.filter(([path, , , roles]) => roles.includes(user.role)||(user.isFormMaster&&roles.includes("form_master")&&["/app/results","/app/reports"].includes(path))); const title = links.find(([path]) => path === location.pathname)?.[1] || "Overview";
  return <div className="app-shell">
    {sidebarOpen && <button className="sidebar-backdrop" onClick={closeSidebar} aria-label="Close navigation" />}
    <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      <div className="brand"><img className="brand-logo" src="/school-logo.png" alt="Shammer Ambassadors Academy"/><div><strong>EduResult</strong><span>Assessment system</span></div><button className="mobile-close" onClick={closeSidebar}><X size={20}/></button></div>
      <div className="school-card"><span>{user.role === "admin" ? "Current school" : `${user.role.replace("_", " ")} workspace`}</span><strong>{user.school?.name}</strong><small>{user.school?.activeSession} · {user.school?.activeTerm}</small></div>
      <nav>{visibleLinks.map(([path, label, Icon]) => <NavLink key={path} end={path === "/app"} to={path} onClick={closeSidebar}><Icon size={19}/><span>{label}</span></NavLink>)}</nav>
      <button className="logout" onClick={signOut}><LogOut size={18}/>Sign out</button>
    </aside>
    <main className="main"><header className="topbar"><button className="menu" onClick={toggleSidebar}><Menu size={22}/></button><div><p>{user.role.replace("_", " ")} workspace</p><h1>{title}</h1></div><div className="top-actions"><button className="icon-button" aria-label="Notifications"><Bell size={20}/><i /></button><div className="profile-menu" ref={profileRef}><button className="user-chip" onClick={()=>setProfileOpen(!profileOpen)} aria-expanded={profileOpen}><span>{user.name.split(" ").map(n=>n[0]).slice(0,2).join("")}</span><div><strong>{user.name}</strong><small>{user.role.replace("_", " ")}</small></div><ChevronDown size={16}/></button>{profileOpen&&<div className="profile-dropdown"><div><strong>{user.name}</strong><small>{user.email}</small></div><button onClick={signOut}><LogOut size={17}/>Sign out</button></div>}</div></div></header><div className="page"><Outlet /></div></main>
  </div>;
}
