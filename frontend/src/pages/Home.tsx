import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ConfigProvider, DatePicker, Empty, Segmented, Space } from 'antd';
import {
  AppstoreOutlined,
  BulbOutlined,
  CalendarOutlined,
  HeartOutlined,
  SkinOutlined,
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
  const [readPostIds, setReadPostIds] = useState<number[]>([]);

  useEffect(() => {
    const syncGeneratedPosts = () => {
      setGeneratedPosts(loadGeneratedFeedPosts());
    };

    const syncReadPosts = () => {
      const readRaw = localStorage.getItem('blog-read-posts');
      if (readRaw) {
        setReadPostIds(JSON.parse(readRaw));
        return;
      }

      setReadPostIds([]);
    };

    const handleStorage = () => {
      syncGeneratedPosts();
      syncReadPosts();
    };

    syncGeneratedPosts();
    syncReadPosts();

    window.addEventListener(AUTOMATION_EVENT, syncGeneratedPosts);
    window.addEventListener('blog-read-updated', syncReadPosts);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(AUTOMATION_EVENT, syncGeneratedPosts);
      window.removeEventListener('blog-read-updated', syncReadPosts);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const feedPosts = useMemo(() => mergeFeedPosts(FAKE_POSTS, generatedPosts), [generatedPosts]);

  const filteredPosts = useMemo(() => {
    return feedPosts.filter((post) => {
      if (readPostIds.includes(post.id)) {
        return false;
      }

      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;

      let matchesDate = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const postDate = dayjs(post.createdAt);
        matchesDate = postDate.isBetween(dateRange[0], dateRange[1], 'day', '[]');
      }

      return matchesCategory && matchesDate;
    });
  }, [dateRange, feedPosts, readPostIds, selectedCategory]);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#c37d9e',
          borderRadius: 18,
          colorText: '#56445f',
          colorTextPlaceholder: '#b894a8',
        },
      }}
    >
      <div className="editorial-filter-rail">
        <div className="editorial-filter-card">
          <Space size="middle" wrap className="editorial-filter-card__content">
            <RangePicker
              className="editorial-range-picker"
              presets={rangePresets as never}
              suffixIcon={<CalendarOutlined />}
              placeholder={['Từ ngày', 'Đến ngày']}
              onChange={(values) =>
                setDateRange(values as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)
              }
              value={dateRange}
            />

            <Segmented
              className="editorial-category-segmented"
              options={[
                { label: 'Tất cả', value: 'all', icon: <AppstoreOutlined /> },
                { label: 'Thời trang', value: 'fashion', icon: <SkinOutlined /> },
                { label: 'Sức khỏe', value: 'health', icon: <HeartOutlined /> },
                { label: 'Mẹo Vặt', value: 'tips', icon: <BulbOutlined /> },
              ]}
              value={selectedCategory}
              onChange={setSelectedCategory}
            />
          </Space>
        </div>
      </div>

      <div className="editorial-feed">
        <AnimatePresence>
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} isRead={readPostIds.includes(post.id)} />
            ))
          ) : (
            <Empty
              className="editorial-feed__empty"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="editorial-feed__empty-text">
                  Bẩm cậu Chủ, "vùng trời" này hiện chưa có bài viết nào ạ! 🔍
                </div>
              }
            />
          )}
        </AnimatePresence>
      </div>
    </ConfigProvider>
  );
};

export default Home;
