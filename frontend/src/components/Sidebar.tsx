import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Files,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  Wand2,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

const navItems = [
  {
    to: '/',
    label: 'Bảng tin',
    note: 'Nhịp feed mỗi ngày',
    icon: LayoutDashboard,
  },
  {
    to: '/posts',
    label: 'Lưu trữ',
    note: 'Khoảnh khắc đã lưu',
    icon: Files,
  },
  {
    to: '/settings',
    label: 'Cài đặt',
    note: 'Phòng điều khiển AI',
    icon: Settings,
  },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => (
  <aside className={`glass-sidebar editorial-sidebar ${isOpen ? 'open' : 'closed'}`}>
    <div className="editorial-sidebar__shell">
      <div className="sidebar-header editorial-brand">
        <motion.div
          className="editorial-brand__mark"
          animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.04, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles size={18} />
          <span className="editorial-brand__halo" />
        </motion.div>

        <div className="editorial-brand__copy">
          <span className="editorial-brand__eyebrow">personal editorial feed</span>
          <span className="logo-title">Blog AI</span>
        </div>
      </div>

      <div className="editorial-brand__ribbon">
        <Wand2 size={14} />
        <span>Dreamy archive for everyday beauty</span>
      </div>

      <nav className="sidebar-links">
        {navItems.map(({ to, label, note, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-link__accent" />
            <span className="nav-link__icon">
              <Icon size={18} />
            </span>
            <span className="nav-link__copy">
              <span className="nav-link__title">{label}</span>
              <span className="nav-link__note">{note}</span>
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footnote">
        <span className="sidebar-footnote__label">Moodboard note</span>
        <p>Thiết kế để việc viết lách, lưu trữ và nuôi feed trở nên mềm mại hơn mỗi ngày.</p>
      </div>

      <div className="user-section">
        <img
          src="https://api.dicebear.com/7.x/adventurer/svg?seed=Felix"
          alt="Cậu Chủ"
          className="avatar-small"
        />
        <div className="user-names">
          <strong>Cậu Chủ</strong>
          <span>Editor in bloom</span>
        </div>
        <button type="button" className="logout-icon" aria-label="Đăng xuất">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  </aside>
);

export default Sidebar;
