import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Smile, MapPin, Send, Plus } from 'lucide-react';

const Editor: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');

  return (
    <motion.div 
      className={`editor-fb-style-2026 ${isExpanded ? 'expanded' : ''}`}
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="editor-top">
        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="user" className="avatar-small" />
        <textarea 
          placeholder="Cậu Chủ ơi, hôm nay có gì vui không ạ?..."
          value={content}
          onFocus={() => setIsExpanded(true)}
          onChange={(e) => setContent(e.target.value)}
          className="editor-input"
        />
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            className="editor-expanded-actions"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="divider" />
            <div className="action-buttons-group">
              <button className="action-btn-pill image"><Image size={18} /> <span>Ảnh/Video</span></button>
              <button className="action-btn-pill mood"><Smile size={18} /> <span>Cảm xúc</span></button>
              <button className="action-btn-pill location"><MapPin size={18} /> <span>Vị trí</span></button>
              <button className="action-btn-pill more"><Plus size={18} /></button>
            </div>
            
            <div className="editor-submit-row">
              <div className="privacy-select">
                <span>Công khai 🌎</span>
              </div>
              <motion.button 
                className={`btn-post-2026 ${content.trim() ? 'active' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!content.trim()}
              >
                Đăng ngay <Send size={16} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Nút đóng thu nhỏ Editor khi click ra ngoài (giả lập overlay nhẹ) */}
      {isExpanded && <div className="editor-close-trigger" onClick={() => setIsExpanded(false)}>Thu nhỏ ☝️</div>}
    </motion.div>
  );
};

export default Editor;
