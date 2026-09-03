import { NavLink } from "react-router-dom";
import {
  TbLayoutDashboard,
  TbWashMachine,
  TbToolsKitchen2,
  TbListDetails,
  TbClipboardList,
  TbUsers,
  TbCalendarStats,
  TbBox,
  TbChartBar,
  TbLogout,
  TbPackages,
} from "react-icons/tb";
import { useAuth } from "../context/AuthContext.jsx";

const navItems = [
  {
    to: "/",
    label: "Dashboard",
    icon: TbLayoutDashboard,
    accent: "neutral",
  },

  // =====================================================
  // LAUNDRY
  // =====================================================

  {
    to: "/laundry",
    label: "Laundry",
    icon: TbWashMachine,
    accent: "laundry",
  },

  // =====================================================
  // FOOD
  // =====================================================

  {
    to: "/kasir",
    label: "Food",
    icon: TbToolsKitchen2,
    accent: "food",
  },

  {
    to: "/orders",
    label: "Orders",
    icon: TbListDetails,
    accent: "food",
  },

  {
    to: "/menu",
    label: "Menu",
    icon: TbClipboardList,
    accent: "food",
  },

  // =====================================================
  // INVENTORY
  // =====================================================

  {
    to: "/food-inventory",
    label: "Food Inventory",
    icon: TbPackages,
    accent: "food",
  },

  {
    to: "/inventory",
    label: "Inventory",
    icon: TbBox,
    accent: "neutral",
  },

  // =====================================================
  // EMPLOYEE
  // =====================================================

  {
    to: "/karyawan",
    label: "Karyawan",
    icon: TbUsers,
    accent: "neutral",
  },

  {
    to: "/absensi",
    label: "Absensi",
    icon: TbCalendarStats,
    accent: "neutral",
  },

  // =====================================================
  // REPORT
  // =====================================================

  {
    to: "/laporan",
    label: "Laporan",
    icon: TbChartBar,
    accent: "neutral",
  },
];

const accentClasses = {
  laundry:
    "border-laundry text-laundry bg-laundry-light",

  food:
    "border-food text-food bg-food-light",

  neutral:
    "border-white text-white bg-white/10",
};

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-screen w-64 flex-col bg-ink text-slate-300 font-body">

      {/* =================================================
          LOGO
      ================================================= */}

      <div className="border-b border-white/10 px-6 py-6">

        <p className="font-display text-lg font-bold leading-tight text-white">
          Laundry
          <span className="text-food">&amp;</span>
          Food
        </p>

        <p className="mt-0.5 text-xs text-slate-400">
          POS Dashboard
        </p>

      </div>

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">

        {navItems.map(
          ({
            to,
            label,
            icon: Icon,
            accent,
          }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? accentClasses[accent]
                    : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          )
        )}

      </nav>

      {/* =================================================
          USER / LOGOUT
      ================================================= */}

      <div className="border-t border-white/10 px-3 py-4">

        <div className="flex items-center gap-3 px-3 py-2">

          {/* AVATAR */}

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
            {(user?.name || "A")
              .charAt(0)
              .toUpperCase()}
          </div>

          {/* USER INFO */}

          <div className="min-w-0 flex-1">

            <p className="truncate text-sm font-medium text-white">
              {user?.name || "Admin"}
            </p>

            <p className="truncate text-xs text-slate-400">
              {user?.role || "owner"}
            </p>

          </div>

          {/* LOGOUT */}

          <button
            onClick={logout}
            title="Keluar"
            className="rounded-md p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <TbLogout size={18} />
          </button>

        </div>

      </div>

    </aside>
  );
}