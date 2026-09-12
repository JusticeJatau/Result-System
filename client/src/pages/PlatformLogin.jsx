import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { platformApi } from "../api/client";

export default function PlatformLogin(){
 const navigate=useNavigate(); const [form,setForm]=useState({username:"",password:""}); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
 if(localStorage.getItem("eduresult_platform_token"))return <Navigate to="/echo8v-control-portal/dashboard" replace/>;
 async function submit(event){event.preventDefault();setBusy(true);setError("");try{const {data}=await platformApi.post("/platform/auth/login",form);localStorage.setItem("eduresult_platform_token",data.token);localStorage.setItem("eduresult_platform_admin",JSON.stringify(data.admin));navigate("/echo8v-control-portal/dashboard",{replace:true})}catch(err){setError(err.response?.data?.message||"Could not connect to the platform server")}finally{setBusy(false)}}
 return <main className="platform-login"><form onSubmit={submit}><div className="platform-symbol"><LockKeyhole/></div><span>ECHO8V PRIVATE CONTROL</span><h1>Platform Owner</h1><p>Manage schools, access and subscriptions.</p>{error&&<div className="error-box">{error}</div>}<label>Username<input value={form.username} onChange={event=>setForm({...form,username:event.target.value})} required autoFocus autoComplete="username"/></label><label>Password<input type="password" value={form.password} onChange={event=>setForm({...form,password:event.target.value})} required autoComplete="current-password"/></label><button className="primary wide" disabled={busy}>{busy?"Verifying...":"Access control panel"}</button></form></main>;
}
