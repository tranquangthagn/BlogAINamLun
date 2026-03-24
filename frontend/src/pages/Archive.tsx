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
import { listArchive } from '../api/archive';
import PostCard from '../components/PostCard';
import type { Post } from '../data/mockData';

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;
const { Title, Paragraph } = Typography;
const AUTOMATION_EVENT = 'blog-ai-automation-updated';

const rangePresets: { label: string; value: [dayjs.Dayjs, dayjs.Dayjs] }[] = [
  { label: 'HĂ´m nay', value: [dayjs(), dayjs()] },
  { label: '7 ngĂ y qua', value: [dayjs().subtract(7, 'd'), dayjs()] },
  { label: 'ThĂ¡ng nĂ y', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
];

const Archive: React.FC = () => {
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [readPosts, setReadPosts] = useState<Post[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | number>('all');
  const [archiveTab, setArchiveTab] = useState<string>('saved');

  useEffect(() => {
    let active = true;

    const syncArchive = async () => {
      try {
        const [savedArchive, readArchive] = await Promise.all([listArchive('saved'), listArchive('read')]);
        if (!active) {
          return;
        }

        setSavedPosts(savedArchive);
        setReadPosts(readArchive);
      } catch {
        if (!active) {
          return;
        }

        setSavedPosts([]);
        setReadPosts([]);
      }
    };

    syncArchive();

    window.addEventListener('blog-archive-updated', syncArchive);
    window.addEventListener('blog-read-updated', syncArchive);
    window.addEventListener(AUTOMATION_EVENT, syncArchive);

    return () => {
      active = false;
      window.removeEventListener('blog-archive-updated', syncArchive);
      window.removeEventListener('blog-read-updated', syncArchive);
      window.removeEventListener(AUTOMATION_EVENT, syncArchive);
    };
  }, []);

  const readPostIds = useMemo(() => readPosts.map((post) => post.id), [readPosts]);

  const filteredPosts = useMemo(() => {
    const sourcePosts = archiveTab === 'saved' ? savedPosts : readPosts;

    return sourcePosts.filter((post) => {
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;

      let matchesDate = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const postDate = dayjs(post.createdAt);
        matchesDate = postDate.isBetween(dateRange[0], dateRange[1], 'day', '[]');
      }

      return matchesCategory && matchesDate;
    });
  }, [archiveTab, dateRange, readPosts, savedPosts, selectedCategory]);

  const emptyText =
    archiveTab === 'saved'
      ? savedPosts.length === 0
        ? 'Kho bĂ¡u hiá»‡n cĂ²n trá»‘ng, nhÆ°ng nÆ¡i nĂ y sáº½ Ä‘áº¹p lĂªn ngay khi cáº­u báº¯t Ä‘áº§u lÆ°u láº¡i nhá»¯ng Ä‘iá»u mĂ¬nh thĂ­ch.'
        : 'ChÆ°a cĂ³ bĂ i lÆ°u trá»¯ nĂ o khá»›p vá»›i bá»™ lá»c hiá»‡n táº¡i.'
      : readPosts.length === 0
        ? 'Dáº¥u chĂ¢n Ä‘á»c váº«n cĂ²n yĂªn áº¯ng. Khi cáº­u má»Ÿ vĂ  Ä‘Ă¡nh dáº¥u bĂ i viáº¿t, nÆ¡i nĂ y sáº½ lÆ°u láº¡i nhá»‹p Ä‘á»c ráº¥t riĂªng.'
        : 'ChÆ°a cĂ³ bĂ i Ä‘Ă£ Ä‘á»c nĂ o khá»›p vá»›i bá»™ lá»c hiá»‡n táº¡i.';

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
              Kho LÆ°u Trá»¯ Cá»§a Cáº­u Chá»§
            </Title>
            <Paragraph className="editorial-archive-hero__text">
              NÆ¡i nhá»¯ng bĂ i viáº¿t yĂªu thĂ­ch, dáº¥u chĂ¢n Ä‘á»c vĂ  nhá»¯ng máº£nh cáº£m há»©ng Ä‘Æ°á»£c cáº¥t láº¡i
              má»™t cĂ¡ch nháº¹ nhĂ ng, Ä‘áº¹p máº¯t vĂ  dá»… tĂ¬m.
            </Paragraph>
          </div>

          <div className="editorial-archive-tabs">
            <Segmented
              size="large"
              className="editorial-archive-tabs__segmented"
              options={[
                { label: 'Kho bĂ¡u', value: 'saved', icon: <StarOutlined /> },
                { label: 'Dáº¥u chĂ¢n', value: 'read', icon: <HistoryOutlined /> },
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
                placeholder={['Tá»« ngĂ y', 'Äáº¿n ngĂ y']}
                onChange={(values) =>
                  setDateRange(values as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)
                }
                value={dateRange}
              />

              <Segmented
                className="editorial-category-segmented"
                options={[
                  { label: 'Táº¥t cáº£', value: 'all', icon: <AppstoreOutlined /> },
                  { label: 'Thá»i trang', value: 'fashion', icon: <SkinOutlined /> },
                  { label: 'Sá»©c khá»e', value: 'health', icon: <HeartOutlined /> },
                  { label: 'Máº¹o Váº·t', value: 'tips', icon: <BulbOutlined /> },
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
                      <strong>{archiveTab === 'saved' ? 'Kho bĂ¡u Ä‘ang nghá»‰ ngÆ¡i' : 'Dáº¥u chĂ¢n cĂ²n yĂªn áº¯ng'}</strong>
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
