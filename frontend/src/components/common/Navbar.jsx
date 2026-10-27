import { useState } from "react";
import { FaUserCircle, FaCog } from "react-icons/fa";
import NotificationBell from "./NotificationBell";
import SettingsModal from "./SettingsModal";

const Navbar = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <nav className="h-16 bg-white shadow flex items-center justify-between px-8">
      <h1 className="text-2xl font-bold text-blue-600">
        SkillSync
      </h1>

      <div className="flex items-center gap-3">
        <NotificationBell />

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition cursor-pointer"
          title="Settings & Preferences"
        >
          <FaCog className="w-5 h-5" />
        </button>

        <span className="text-gray-600 text-sm font-medium">
          Account
        </span>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="text-gray-600 hover:text-blue-600 cursor-pointer"
          title="Account Settings"
        >
          <FaUserCircle size={32} />
        </button>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </nav>
  );
};

export default Navbar;