import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import CreatePost from './pages/CreatePost';
import Archive from './pages/Archive';
import Settings from './pages/Settings';
import {
  appendPostedFeedPost,
  generateAutomationPost,
  loadAutomationSettings,
  loadGeneratedFeedPosts,
  loadGenerationHistory,
  markPreviewAsPosted,
  saveAutomationSettings,
  saveGeneratedFeedPosts,
  saveGenerationHistory,
  shouldRunAutomationNow,
  upsertPreviewIntoHistory,
} from './data/automationSettings';
import './App.css';

const AUTOMATION_EVENT = 'blog-ai-automation-updated';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const runAutomationTick = () => {
      const settings = loadAutomationSettings();
      if (!shouldRunAutomationNow(settings, settings.lastRunAt)) {
        return;
      }

      try {
        const history = loadGenerationHistory();
        const preview = generateAutomationPost(settings, history.filter((item) => item.posted));
        const postedPreview = markPreviewAsPosted(preview);
        const nextHistory = upsertPreviewIntoHistory(postedPreview, history);
        const nextFeedPosts = appendPostedFeedPost(postedPreview.feedPost, loadGeneratedFeedPosts());
        const nextSettings = {
          ...settings,
          lastRunAt: postedPreview.createdAt,
          lastGeneratedPostId: postedPreview.id,
        };

        saveGenerationHistory(nextHistory);
        saveGeneratedFeedPosts(nextFeedPosts);
        saveAutomationSettings(nextSettings);
        window.dispatchEvent(new Event(AUTOMATION_EVENT));
      } catch {
        // Invalid settings should not break the app loop.
      }
    };

    runAutomationTick();
    const timer = window.setInterval(runAutomationTick, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <Router>
      <div className="app-container">
        <div className="bg-circle one"></div>
        <div className="bg-circle two"></div>

        <Sidebar isOpen={sidebarOpen} />

        <main className="main-feed">
          <header className="glass-navbar">
            <div className="nav-search">
              <input type="text" placeholder="Tìm kiếm niềm vui..." />
            </div>
            <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={24} />
            </button>
          </header>

          <div className="content-scroll">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<CreatePost />} />
              <Route path="/posts" element={<Archive />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
