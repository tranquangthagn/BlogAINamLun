import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { Menu, Search, Sparkles } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Archive from './pages/Archive';
import Settings from './pages/Settings';
import './App.css';

const SHELL_COPY: Record<
  string,
  {
    eyebrow: string;
    title: string;
    meta: string;
    placeholder: string;
    hint: string;
  }
> = {
  '/': {
    eyebrow: 'Poetic Editorial Dream',
    title: 'Feed hôm nay đang ở nhịp dịu và thoáng hơn.',
    meta: 'Một dải điều hướng gọn để mắt nghỉ nhiều hơn.',
    placeholder: 'Tìm kiếm cảm hứng, xu hướng, hoặc một ý niệm đẹp...',
    hint: 'khám phá',
  },
  '/posts': {
    eyebrow: 'Personal Memory Vault',
    title: 'Kho lưu trữ đang gom lại những điều đáng giữ.',
    meta: 'Một nơi nhẹ nhàng để tìm lại bài đã lưu và dấu chân đọc của cậu.',
    placeholder: 'Tìm lại bài đã lưu, một ký ức đẹp, hay dấu chân đọc...',
    hint: 'tìm lại',
  },
  '/settings': {
    eyebrow: 'AI Control Room',
    title: 'Phòng điều khiển đang chờ cậu chỉnh nhịp cho AI.',
    meta: 'Lịch đăng, nguồn trend và preview đều được gom vào một studio mềm hơn.',
    placeholder: 'Tìm cài đặt, nguồn trend, khoảng thời gian hoặc trạng thái AI...',
    hint: 'điều chỉnh',
  },
};

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const shellCopy = SHELL_COPY[location.pathname] ?? SHELL_COPY['/'];

  return (
    <div className="app-container">
      <div className="bg-circle one" />
      <div className="bg-circle two" />

      <Sidebar isOpen={sidebarOpen} />

      <main className="main-feed">
        <header className="glass-navbar editorial-topbar editorial-topbar--slim">
          <div className="editorial-topbar__status editorial-topbar__status--slim">
            <span className="editorial-topbar__eyebrow">{shellCopy.eyebrow}</span>
            <strong>{shellCopy.title}</strong>
            <span className="editorial-topbar__meta">{shellCopy.meta}</span>
          </div>

          <label
            className="nav-search editorial-search editorial-search--slim"
            aria-label="Tìm kiếm cảm hứng"
          >
            <Search size={17} />
            <input type="text" placeholder={shellCopy.placeholder} />
            <span className="editorial-search__hint">
              <Sparkles size={14} />
              {shellCopy.hint}
            </span>
          </label>

          <button
            type="button"
            className="menu-btn editorial-menu-btn editorial-menu-btn--slim"
            onClick={() => setSidebarOpen((value) => !value)}
            aria-label="Mở hoặc thu gọn menu"
          >
            <span className="menu-btn__label">Menu</span>
            <Menu size={22} />
          </button>
        </header>

        <div className="content-scroll">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/posts" element={<Archive />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
