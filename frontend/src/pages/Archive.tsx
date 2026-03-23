import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { DatePicker, Segmented, Space, Empty, ConfigProvider, Typography } from 'antd';
import { 
  CalendarOutlined, 
  AppstoreOutlined, 
  SkinOutlined, 
  HeartOutlined, 
  BulbOutlined,
  InboxOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import PostCard from '../components/PostCard';
import { Post } from '../data/mockData';

dayjs.extend(isBetween);
const { RangePicker } = DatePicker;
const { Title } = Typography;

const rangePresets: { label: string; value: [dayjs.Dayjs, dayjs.Dayjs] }[] = [
  { label: 'Hôm nay', value: [dayjs(), dayjs()] },
  { label: '7 ngày qua', value: [dayjs().subtract(7, 'd'), dayjs()] },
  { label: 'Tháng này', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
];

const Archive: React.FC = () => {
  const [archivedPosts, setArchivedPosts] = useState<Post[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | number>('all');

  // Hàm load dữ liệu từ LocalStorage
  const loadArchivedPosts = () => {
    const saved = localStorage.getItem('blog-saved-posts');
    if (saved) {
      setArchivedPosts(JSON.parse(saved));
    } else {
      setArchivedPosts([]);
    }
  };

  // Load lần đầu
  useEffect(() => {
    loadArchivedPosts();

    // Lắng nghe sự kiện cập nhật từ PostCard để load lại danh sách khi Bỏ lưu
    window.addEventListener('blog-archive-updated', loadArchivedPosts);
    return () => window.removeEventListener('blog-archive-updated', loadArchivedPosts);
  }, []);

  const filteredPosts = useMemo(() => {
    return archivedPosts.filter(post => {
      // 1. Lọc theo Category
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      
      // 2. Lọc theo Khoảng ngày
      let matchesDate = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const postDate = dayjs(post.createdAt);
        matchesDate = postDate.isBetween(dateRange[0], dateRange[1], 'day', '[]');
      }

      return matchesCategory && matchesDate;
    });
  }, [archivedPosts, dateRange, selectedCategory]);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 12,
        },
      }}
    >
      <div className="archive-page" style={{ padding: '0 20px', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh' }}>
        <Title level={2} style={{ marginTop: '40px', marginBottom: '8px', textAlign: 'center' }}>
          📦 Kho Lưu Trữ Của Cậu Chủ
        </Title>
        <p style={{ textAlign: 'center', color: '#8c8c8c', marginBottom: '32px' }}>
          Nơi lưu giữ những kiến thức và kỉ niệm quý báu của cậu Chủ ✨
        </p>
        
        {/* Bộ lọc Sticky giống trang chủ */}
        <div className="filter-wrapper" style={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 1000, 
          padding: '16px 0',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          marginBottom: '32px'
        }}>
          <div 
            className="filter-container" 
            style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <Space size="middle" wrap>
              <RangePicker 
                presets={rangePresets as any}
                suffixIcon={<CalendarOutlined style={{ color: '#1890ff' }} />}
                placeholder={['Từ ngày', 'Đến ngày']}
                style={{ borderRadius: '30px', padding: '8px 20px', background: '#fff' }}
                onChange={(values) => setDateRange(values as any)}
                value={dateRange}
              />

              <Segmented
                options={[
                  { label: 'Tất cả', value: 'all', icon: <AppstoreOutlined /> },
                  { label: 'Thời trang', value: 'fashion', icon: <SkinOutlined /> },
                  { label: 'Sức khỏe', value: 'health', icon: <HeartOutlined /> },
                  { label: 'Mẹo Vặt', value: 'tips', icon: <BulbOutlined /> }
                ]}
                value={selectedCategory}
                onChange={setSelectedCategory}
                style={{ padding: '4px', borderRadius: '30px', background: 'rgba(0,0,0,0.04)' }}
              />
            </Space>
          </div>
        </div>

        <div className="feed-container" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '60px' }}>
          <AnimatePresence mode='popLayout'>
            {filteredPosts.length > 0 ? (
              filteredPosts.map(post => (
                <PostCard key={post.id} post={post} isArchivePage={true} />
              ))
            ) : (
              <Empty 
                image={<InboxOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
                description={
                  <div style={{ color: '#999', fontSize: '16px', marginTop: '16px' }}>
                    {archivedPosts.length === 0 
                      ? "Bẩm cậu Chủ, kho báu hiện đang trống trải quá ạ! 🥰" 
                      : "Bẩm cậu Chủ, không có bài lưu trữ nào khớp với bộ lọc ạ! 🔍"}
                  </div>
                }
                style={{ marginTop: '100px' }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default Archive;
