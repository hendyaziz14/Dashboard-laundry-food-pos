import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import LaundryPOS from "./pages/LaundryPOS.jsx";
import FoodPOS from "./pages/FoodPOS.jsx";
import Riwayat from "./pages/Riwayat.jsx";
import Menu from "./pages/Menu.jsx";
import Karyawan from "./pages/Karyawan.jsx";
import Absensi from "./pages/Absensi.jsx";
import Inventory from "./pages/Inventory.jsx";
import Laporan from "./pages/Laporan.jsx";

function withProtection(Component) {
  return (
    <ProtectedRoute>
      <Component />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={withProtection(Dashboard)} />
      <Route path="/laundry" element={withProtection(LaundryPOS)} />
      <Route path="/kasir" element={withProtection(FoodPOS)} />
      <Route path="/orders" element={withProtection(Riwayat)} />
      <Route path="/menu" element={withProtection(Menu)} />
      <Route path="/karyawan" element={withProtection(Karyawan)} />
      <Route path="/absensi" element={withProtection(Absensi)} />
      <Route path="/inventory" element={withProtection(Inventory)} />
      <Route path="/laporan" element={withProtection(Laporan)} />
      <Route path="*" element={withProtection(Dashboard)} />
    </Routes>
  );
}
