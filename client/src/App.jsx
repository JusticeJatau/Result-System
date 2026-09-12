import { Navigate, Route, Routes } from "react-router-dom";
import { useAppStore } from "./store/useAppStore";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Directory from "./pages/Directory";
import Scores from "./pages/Scores";
import Results from "./pages/Results";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Academic from "./pages/Academic";
import Audit from "./pages/Audit";
import PlatformLogin from "./pages/PlatformLogin";
import PlatformDashboard from "./pages/PlatformDashboard";

function Protected(){return useAppStore(state=>state.user)?<Layout/>:<Navigate to="/login" replace/>}
function RoleRoute({roles,children}){const user=useAppStore(state=>state.user);const permitted=roles.includes(user?.role)||(roles.includes("form_master")&&user?.isFormMaster);return permitted?children:<Navigate to="/app" replace/>}
function PlatformProtected(){return localStorage.getItem("eduresult_platform_token")?<PlatformDashboard/>:<Navigate to="/echo8v-control-portal" replace/>}

export default function App(){return <Routes>
  <Route path="/echo8v-control-portal" element={<PlatformLogin/>}/>
  <Route path="/echo8v-control-portal/dashboard" element={<PlatformProtected/>}/>
  <Route path="/login" element={<Login/>}/>
  <Route path="/app" element={<Protected/>}>
    <Route index element={<Dashboard/>}/>
    <Route path="students" element={<RoleRoute roles={["admin","form_master"]}><Directory type="students"/></RoleRoute>}/>
    <Route path="teachers" element={<RoleRoute roles={["admin"]}><Directory type="teachers"/></RoleRoute>}/>
    <Route path="academic" element={<RoleRoute roles={["admin"]}><Academic/></RoleRoute>}/>
    <Route path="subjects" element={<Directory type="subjects"/>}/>
    <Route path="scores" element={<RoleRoute roles={["teacher"]}><Scores/></RoleRoute>}/>
    <Route path="results" element={<RoleRoute roles={["admin","form_master"]}><Results/></RoleRoute>}/>
    <Route path="reports" element={<RoleRoute roles={["admin","form_master"]}><Reports/></RoleRoute>}/>
    <Route path="audit" element={<RoleRoute roles={["admin"]}><Audit/></RoleRoute>}/>
    <Route path="settings" element={<RoleRoute roles={["admin"]}><Settings/></RoleRoute>}/>
  </Route>
  <Route path="*" element={<Navigate to="/app" replace/>}/>
</Routes>}
