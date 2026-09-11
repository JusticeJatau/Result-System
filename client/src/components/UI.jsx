import { Search, Plus, X } from "lucide-react";
import { useState } from "react";

export function PageHead({ title, text, action, onAction }) { return <div className="page-head"><div><h2>{title}</h2><p>{text}</p></div>{action && <button className="primary" onClick={onAction}><Plus size={18}/>{action}</button>}</div>; }
export function SearchBox({ value, onChange, placeholder = "Search..." }) { return <label className="search"><Search size={18}/><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}/></label>; }
export function Status({ children }) { return <span className={`status ${children.toLowerCase().replace(" ", "-")}`}>{children}</span>; }
export function Modal({ title, children, onClose }) { return <div className="modal-wrap"><button className="modal-backdrop" onClick={onClose}/><section className="modal"><header><h3>{title}</h3><button onClick={onClose}><X size={20}/></button></header>{children}</section></div>; }
export function Toast({ message }) { return message ? <div className="toast">✓ {message}</div> : null; }
export function useToast() { const [message, setMessage] = useState(""); return [message, text => { setMessage(text); setTimeout(() => setMessage(""), 2400); }]; }
