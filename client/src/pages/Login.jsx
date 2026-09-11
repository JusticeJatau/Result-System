import { useState } from "react";
import { Navigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import api from "../api/client";
import { useAppStore } from "../store/useAppStore";

export default function Login() {
  const { user, login, useDemo } = useAppStore(); const [show, setShow] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "admin@brightfuture.edu", password: "password123" });
  if (user) return <Navigate to="/app" replace/>;
  async function submit(e) { e.preventDefault(); setBusy(true); setError(""); try { const { data } = await api.post("/auth/login", form); login(data.user, data.token); } catch (err) { setError(err.response?.data?.message || "The server is offline. Use the demo below."); } finally { setBusy(false); } }
  return <div className="login-page"><section className="login-story"><div className="story-brand"><div className="brand-mark">ER</div><strong>EduResult</strong></div><div className="story-copy"><span>School results, simplified</span><h1>From score entry to finished report cards.</h1><p>One reliable workspace for teachers, Form Masters and school administrators.</p><ul><li><CheckCircle2/>Automatic calculations and grades</li><li><CheckCircle2/>Clear review and approval workflow</li><li><CheckCircle2/>Professional printable report cards</li></ul></div><small>Built for the way Nigerian schools work.</small></section>
  <main className="login-form"><form onSubmit={submit}><div className="mobile-brand"><div className="brand-mark">ER</div><strong>EduResult</strong></div><p className="eyebrow">WELCOME BACK</p><h2>Sign in to your school</h2><p className="muted">Enter your staff account details to continue.</p>{error && <div className="error-box">{error}</div>}<label>Email address<input type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} required/></label><label>Password<div className="password"><input type={show ? "text" : "password"} value={form.password} onChange={e => setForm({...form,password:e.target.value})} required/><button type="button" onClick={() => setShow(!show)}>{show ? <EyeOff/> : <Eye/>}</button></div></label><button className="primary wide" disabled={busy}>{busy ? "Signing in..." : <>Sign in <ArrowRight size={18}/></>}</button><div className="demo-divider"><span>or preview without a database</span></div><button type="button" className="secondary wide" onClick={useDemo}>Open interactive demo</button></form></main></div>;
}
