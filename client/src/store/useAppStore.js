import { create } from "zustand";

export const useAppStore = create(set => ({
  user: JSON.parse(localStorage.getItem("eduresult_user") || "null"),
  sidebarOpen: false,
  login(user, token) { localStorage.setItem("eduresult_user", JSON.stringify(user)); localStorage.setItem("eduresult_token", token); set({ user }); },
  logout() { localStorage.removeItem("eduresult_user"); localStorage.removeItem("eduresult_token"); set({ user: null }); },
  toggleSidebar() { set(state => ({ sidebarOpen: !state.sidebarOpen })); },
  closeSidebar() { set({ sidebarOpen: false }); }
}));
