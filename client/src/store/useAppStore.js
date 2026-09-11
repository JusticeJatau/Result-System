import { create } from "zustand";

const demoUser = { name: "Amina Yusuf", role: "admin", school: { name: "Bright Future Academy", activeSession: "2026/2027", activeTerm: "First Term" } };
export const useAppStore = create(set => ({
  user: JSON.parse(localStorage.getItem("eduresult_user") || "null"),
  demoMode: false,
  sidebarOpen: false,
  login(user, token) { localStorage.setItem("eduresult_user", JSON.stringify(user)); localStorage.setItem("eduresult_token", token); set({ user }); },
  useDemo() { set({ user: demoUser, demoMode: true }); },
  logout() { localStorage.removeItem("eduresult_user"); localStorage.removeItem("eduresult_token"); set({ user: null, demoMode: false }); },
  toggleSidebar() { set(state => ({ sidebarOpen: !state.sidebarOpen })); },
  closeSidebar() { set({ sidebarOpen: false }); }
}));
