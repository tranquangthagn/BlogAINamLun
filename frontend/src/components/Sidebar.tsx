import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, FileEdit, Files, Settings, LogOut } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => (
  <aside className={`glass-sidebar ${isOpen ? 'open' : 'closed'}`}>
    <div className="sidebar-header">
      <motion.div 
        className="logo-sparkle" 
        animate={{ rotate: 360 }} 
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        ✨
      </motion.div>
      <span className="logo-title">Blog AI</span>
    </div>
    
    <nav className="sidebar-links">
      <NavLink to="/" className="nav-link">
        <LayoutDashboard size={20} /> <span>Bảng tin</span>
      </NavLink>
      <NavLink to="/create" className="nav-link">
        <FileEdit size={20} /> <span>Viết bài</span>
      </NavLink>
      <NavLink to="/posts" className="nav-link">
        <Files size={20} /> <span>Lưu trữ</span>
      </NavLink>
      <NavLink to="/settings" className="nav-link">
        <Settings size={20} /> <span>Cài đặt</span>
      </NavLink>
    </nav>

    <div className="user-section">
      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="user" className="avatar-small" />
      <div className="user-names">
        <strong>Cậu Chủ</strong>
        <span>Quản trị viên</span>
      </div>
      <LogOut size={18} className="logout-icon" />
    </div>
  </aside>
);

export default Sidebar;
