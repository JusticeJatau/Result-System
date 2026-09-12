import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import api from "../api/client";
import { PageHead } from "../components/UI";

export default function Audit(){const [logs,setLogs]=useState([]);useEffect(()=>{api.get("/audit-logs").then(response=>setLogs(response.data)).catch(()=>setLogs([]))},[]);return <><PageHead title="Audit trail" text="A permanent record of sensitive academic actions."/><section className="table-panel"><div className="table-scroll"><table><thead><tr><th>Staff member</th><th>Action</th><th>Details</th><th>Date and time</th></tr></thead><tbody>{logs.map(log=><tr key={log._id}><td><ShieldCheck size={17}/><strong>{log.user?.name||"System user"}</strong></td><td>{log.action.replaceAll("."," ")}</td><td>{log.details?.teacherName||log.details?.className||log.entity||"—"}{log.details?.count?` · ${log.details.count} records`:""}</td><td>{new Date(log.createdAt).toLocaleString()}</td></tr>)}{!logs.length&&<tr><td className="empty-table" colSpan="4">No activity has been recorded yet.</td></tr>}</tbody></table></div></section></>}
