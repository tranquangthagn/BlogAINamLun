import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { DatePicker, Segmented, Space, Empty, ConfigProvider } from 'antd';
import {
  CalendarOutlined,
  AppstoreOutlined,
  SkinOutlined,
  HeartOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import PostCard from '../components/PostCard';
import { FAKE_POSTS, type Post } from '../data/mockData';
import { loadGeneratedFeedPosts, mergeFeedPosts } from '../data/automationSettings';

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;
const AUTOMATION_EVENT = 'blog-ai-automation-updated';

const rangePresets: { label: string; value: [dayjs.Dayjs, dayjs.Dayjs] }[] = [
  { label: 'Hôm nay', value: [dayjs(), dayjs()] },
  { label: '7 ngày qua', value: [dayjs().subtract(7, 'd'), dayjs()] },
  { label: 'Tháng này', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
  { label: 'Năm nay', value: [dayjs().startOf('year'), dayjs().endOf('year')] },
];

const Home: React.FC = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | number>('all');
  const [generatedPosts, setGeneratedPosts] = useState<Post[]>([]);

  useEffect(() => {
    const syncGeneratedPosts = () => {
      setGeneratedPosts(loadGeneratedFeedPosts());
    };

    syncGeneratedPosts();
    window.addEventListener(AUTOMATION_EVENT, syncGeneratedPosts);
    window.addEventListener('storage', syncGeneratedPosts);

    return () => {
      window.removeEventListener(AUTOMATION_EVENT, syncGeneratedPosts);
      window.removeEventListener('storage', syncGeneratedPosts);
    };
  }, []);

  const feedPosts = useMemo(() => mergeFeedPosts(FAKE_POSTS, generatedPosts), [generatedPosts]);

  const filteredPosts = useMemo(() => {
    return feedPosts.filter((post) => {
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;

      let matchesDate = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const postDate = dayjs(post.createdAt);
        matchesDate = postDate.isBetween(dateRange[0], dateRange[1], 'day', '[]');
      }

      return matchesCategory && matchesDate;
    });
  }, [dateRange, feedPosts, selectedCategory]);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 12,
        },
      }}
    >
      <div
        className="filter-wrapper"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          padding: '16px 0',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s ease',
        }}
      >
        <div
          className="filter-container"
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <Space size="middle" wrap>
            <RangePicker
              presets={rangePresets as never}
              suffixIcon={<CalendarOutlined style={{ color: '#1890ff' }} />}
              placeholder={['Từ ngày', 'Đến ngày']}
              style={{
                borderRadius: '30px',
                padding: '8px 20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid #eee',
                background: '#fff',
              }}
              onChange={(values) => setDateRange(values as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
              value={dateRange}
            />

            <Segmented
              options={[
                { label: 'Tất cả', value: 'all', icon: <AppstoreOutlined /> },
                { label: 'Thời trang', value: 'fashion', icon: <SkinOutlined /> },
                { label: 'Sức khỏe', value: 'health', icon: <HeartOutlined /> },
                { label: 'Mẹo Vặt', value: 'tips', icon: <BulbOutlined /> },
              ]}
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{
                padding: '4px',
                borderRadius: '30px',
                background: 'rgba(0, 0, 0, 0.04)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
              }}
            />
          </Space>
        </div>
      </div>

      <div className="feed-container" style={{ maxWidth: '800px', margin: '40px auto', paddingBottom: '60px' }}>
        <AnimatePresence>
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div style={{ color: '#999', fontSize: '16px', marginTop: '10px' }}>
                  Bẩm cậu Chủ, "vùng trời" này hiện chưa có bài viết nào ạ! 🔍
                </div>
              }
              style={{ marginTop: '100px' }}
            />
          )}
        </AnimatePresence>
      </div>
    </ConfigProvider>
  );
};

export default Home;
