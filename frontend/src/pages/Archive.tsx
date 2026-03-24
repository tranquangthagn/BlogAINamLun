import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ConfigProvider, DatePicker, Empty, Segmented, Space, Typography } from 'antd';
import {
  AppstoreOutlined,
  BulbOutlined,
  CalendarOutlined,
  HeartOutlined,
  HistoryOutlined,
  InboxOutlined,
  SkinOutlined,
  StarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import PostCard from '../components/PostCard';
import { FAKE_POSTS, Post } from '../data/mockData';
import { loadGeneratedFeedPosts, mergeFeedPosts } from '../data/automationSettings';

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;
const { Title, Paragraph } = Typography;
const AUTOMATION_EVENT = 'blog-ai-automation-updated';

const rangePresets: { label: string; value: [dayjs.Dayjs, dayjs.Dayjs] }[] = [
  { label: 'Hôm nay', value: [dayjs(), dayjs()] },
  { label: '7 ngày qua', value: [dayjs().subtract(7, 'd'), dayjs()] },
  { label: 'Tháng này', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
];

const Archive: React.FC = () => {
  const [archivedPosts, setArchivedPosts] = useState<Post[]>([]);
  const [generatedPosts, setGeneratedPosts] = useState<Post[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | number>('all');
  const [readPostIds, setReadPostIds] = useState<number[]>([]);
  const [archiveTab, setArchiveTab] = useState<string>('saved');

  useEffect(() => {
    const loadArchivedPosts = () => {
      const saved = localStorage.getItem('blog-saved-posts');
      setArchivedPosts(saved ? JSON.parse(saved) : []);
    };

    const loadReadPosts = () => {
      const readRaw = localStorage.getItem('blog-read-posts');
      setReadPostIds(readRaw ? JSON.parse(readRaw) : []);
    };

    const syncGeneratedPosts = () => {
      setGeneratedPosts(loadGeneratedFeedPosts());
    };

    const handleStorage = () => {
      loadArchivedPosts();
      loadReadPosts();
      syncGeneratedPosts();
    };

    loadArchivedPosts();
    loadReadPosts();
    syncGeneratedPosts();

    window.addEventListener('blog-archive-updated', loadArchivedPosts);
    window.addEventListener('blog-read-updated', loadReadPosts);
    window.addEventListener(AUTOMATION_EVENT, syncGeneratedPosts);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('blog-archive-updated', loadArchivedPosts);
      window.removeEventListener('blog-read-updated', loadReadPosts);
      window.removeEventListener(AUTOMATION_EVENT, syncGeneratedPosts);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const allAvailablePosts = useMemo(
    () => mergeFeedPosts(FAKE_POSTS, generatedPosts),
    [generatedPosts],
  );

  const filteredPosts = useMemo(() => {
    const sourcePosts =
      archiveTab === 'saved'
        ? archivedPosts
        : allAvailablePosts.filter((post) => readPostIds.includes(post.id));

    return sourcePosts.filter((post) => {
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;

      let matchesDate = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const postDate = dayjs(post.createdAt);
        matchesDate = postDate.isBetween(dateRange[0], dateRange[1], 'day', '[]');
      }

      return matchesCategory && matchesDate;
    });
  }, [allAvailablePosts, archiveTab, archivedPosts, dateRange, readPostIds, selectedCategory]);

  const emptyText =
    archiveTab === 'saved'
      ? archivedPosts.length === 0
        ? 'Kho báu hiện còn trống, nhưng nơi này sẽ đẹp lên ngay khi cậu bắt đầu lưu lại những điều mình thích.'
        : 'Chưa có bài lưu trữ nào khớp với bộ lọc hiện tại.'
      : readPostIds.length === 0
        ? 'Dấu chân đọc vẫn còn yên ắng. Khi cậu mở và đánh dấu bài viết, nơi này sẽ lưu lại nhịp đọc rất riêng.'
        : 'Chưa có bài đã đọc nào khớp với bộ lọc hiện tại.';

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
      <div className="editorial-archive">
        <section className="editorial-archive-hero">
          <div className="editorial-archive-hero__copy">
            <span className="editorial-archive-hero__eyebrow">personal memory vault</span>
            <Title level={2} className="editorial-archive-hero__title">
              Kho Lưu Trữ Của Cậu Chủ
            </Title>
            <Paragraph className="editorial-archive-hero__text">
              Nơi những bài viết yêu thích, dấu chân đọc và những mảnh cảm hứng được cất lại
              một cách nhẹ nhàng, đẹp mắt và dễ tìm.
            </Paragraph>
          </div>

          <div className="editorial-archive-tabs">
            <Segmented
              size="large"
              className="editorial-archive-tabs__segmented"
              options={[
                { label: 'Kho báu', value: 'saved', icon: <StarOutlined /> },
                { label: 'Dấu chân', value: 'read', icon: <HistoryOutlined /> },
              ]}
              value={archiveTab}
              onChange={(value) => setArchiveTab(value as string)}
            />
          </div>
        </section>

        <div className="editorial-filter-rail editorial-archive-filter">
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

        <div className="editorial-feed editorial-archive-feed">
          <AnimatePresence mode="popLayout">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isArchivePage
                  isRead={readPostIds.includes(post.id)}
                />
              ))
            ) : (
              <div className="editorial-archive-empty">
                <Empty
                  image={<InboxOutlined className="editorial-archive-empty__icon" />}
                  description={
                    <div className="editorial-archive-empty__content">
                      <strong>{archiveTab === 'saved' ? 'Kho báu đang nghỉ ngơi' : 'Dấu chân còn yên ắng'}</strong>
                      <span>{emptyText}</span>
                    </div>
                  }
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default Archive;
