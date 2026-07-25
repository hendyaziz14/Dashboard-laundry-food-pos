import Sidebar from "./Sidebar.jsx";

export default function Layout({ children }) {
  return (
    <div className="flex h-screen bg-base font-body">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
