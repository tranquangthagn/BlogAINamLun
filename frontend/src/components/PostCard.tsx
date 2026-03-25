import React from 'react';
import { motion } from 'framer-motion';
import {
  Avatar,
  Button,
  Card,
  Col,
  Image,
  Row,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  HeartOutlined,
  SaveOutlined,
  SkinOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { markPostRead, savePost, unsavePost } from '../api/archive';
import type { Post } from '../types/post';

const { Text, Paragraph } = Typography;

interface PostCardProps {
  post: Post;
  isArchivePage?: boolean;
  isRead?: boolean;
}

const categoryMeta: Record<
  Post['category'],
  {
    label: string;
    colorClass: string;
    icon: React.ReactNode;
  }
> = {
  fashion: { label: 'Thời trang', colorClass: 'fashion', icon: <SkinOutlined /> },
  health: { label: 'Sức khỏe', colorClass: 'health', icon: <HeartOutlined /> },
  tips: { label: 'Mẹo Vặt', colorClass: 'tips', icon: <CalendarOutlined /> },
  general: { label: 'Chung', colorClass: 'general', icon: <CalendarOutlined /> },
};

const PostCard: React.FC<PostCardProps> = ({ post, isArchivePage = false, isRead = false }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(post.content);
    message.success('Đã sao chép nội dung rồi ạ! ✨');
  };

  const handleReadToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isRead) {
      message.info('Bài này đã được đánh dấu đã đọc rồi ạ! ✅');
      return;
    }

    try {
      await markPostRead(post.id);
      message.success('Bẩm cậu Chủ, con đã ghi nhận bài này đã đọc rồi ạ! ✅');
      window.dispatchEvent(new Event('blog-read-updated'));
    } catch (error) {
      message.warning(error instanceof Error ? error.message : 'Chưa thể đánh dấu đã đọc.');
    }
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error();
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 200);
      return true;
    } catch {
      window.open(url, '_blank');
      return false;
    }
  };

  const handleDownloadAll = async () => {
    if (!post.images || post.images.length === 0) {
      message.warning('Bài viết này không có ảnh để tải ạ! 😅');
      return;
    }

    message.loading({ content: 'Đang tải ảnh về máy cậu Chủ... 📥', key: 'downloading' });
    for (let index = 0; index < post.images.length; index += 1) {
      const url = post.images[index];
      const filename = `BlogAINamLun_${post.id}_${index + 1}.jpg`;
      await downloadImage(url, filename);

      if (post.images.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    message.success({ content: 'Đã tải xong toàn bộ ảnh rồi ạ! ✨', key: 'downloading' });
  };

  const handleSaveToggle = async () => {
    try {
      if (isArchivePage) {
        await unsavePost(post.id);
        message.success('Đã dọn dẹp bài này khỏi kho lưu trữ rồi ạ! 🧹');
        window.dispatchEvent(new Event('blog-archive-updated'));
        return;
      }

      await savePost(post.id);
      message.success('Đã cất bài viết vào kho báu rồi ạ! 💾✨');
      window.dispatchEvent(new Event('blog-archive-updated'));
    } catch (error) {
      message.warning(error instanceof Error ? error.message : 'Chưa thể cập nhật kho lưu trữ.');
    }
  };

  const getCategoryTag = () => {
    const meta = categoryMeta[post.category] ?? categoryMeta.general;

    return (
      <Tag className={`editorial-post-tag editorial-post-tag--${meta.colorClass}`} icon={meta.icon}>
        {meta.label}
      </Tag>
    );
  };

  const renderImage = (src: string, index: number, height: number, overlayText?: string) => (
    <div className="editorial-media-grid__cell" key={`${src}-${index}`}>
      <Image
        src={src}
        alt={`${post.author}-${index + 1}`}
        className="editorial-media-grid__image"
        style={{ height }}
      />
      {overlayText ? <div className="editorial-media-grid__overlay">{overlayText}</div> : null}
    </div>
  );

  const renderMediaGrid = (images: string[]) => {
    const count = images.length;
    if (count === 0) {
      return null;
    }

    if (count === 1) {
      return <div className="editorial-media-grid editorial-media-grid--single">{renderImage(images[0], 0, 430)}</div>;
    }

    if (count === 2) {
      return (
        <div className="editorial-media-grid editorial-media-grid--duo">
          {images.slice(0, 2).map((image, index) => renderImage(image, index, 350))}
        </div>
      );
    }

    const displayImages = images.slice(0, 5);
    const remainingCount = count - 5;

    return (
      <div className="editorial-media-grid editorial-media-grid--mosaic">
        <Image.PreviewGroup>
          <Row gutter={[8, 8]}>
            <Col span={count === 3 ? 15 : 24}>
              {renderImage(displayImages[0], 0, count === 3 ? 360 : 280)}
            </Col>
            {count === 3 ? (
              <Col span={9}>
                <div className="editorial-media-grid editorial-media-grid--stack">
                  {displayImages.slice(1, 3).map((image, index) => renderImage(image, index + 1, 176))}
                </div>
              </Col>
            ) : null}
            {count === 4 ? (
              displayImages.slice(1, 4).map((image, index) => (
                <Col span={8} key={`${image}-${index + 1}`}>
                  {renderImage(image, index + 1, 170)}
                </Col>
              ))
            ) : null}
            {count >= 5 ? (
              <>
                {displayImages.slice(1, 5).map((image, index) => (
                  <Col span={6} key={`${image}-${index + 1}`}>
                    {renderImage(
                      image,
                      index + 1,
                      168,
                      index === 3 && remainingCount > 0 ? `+${remainingCount}` : undefined,
                    )}
                  </Col>
                ))}
              </>
            ) : null}
          </Row>
          <div className="editorial-media-grid__hidden">
            {images.slice(5).map((image, index) => (
              <Image key={`${image}-${index + 5}`} src={image} alt={`${post.author}-hidden-${index + 1}`} />
            ))}
          </div>
        </Image.PreviewGroup>
      </div>
    );
  };

  return (
    <motion.div
      className="editorial-post-card-shell"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.42 }}
    >
      <Card
        hoverable
        className={`editorial-post-card ${isRead ? 'is-read' : ''}`}
        bodyStyle={{ padding: 0 }}
      >
        <div className="editorial-post-card__body">
          <div className="editorial-post-card__header">
            <Space size="middle" className="editorial-post-card__author">
              <Avatar
                src={post.avatar}
                size={58}
                icon={<UserOutlined />}
                className="editorial-post-card__avatar"
              />
              <div className="editorial-post-card__author-copy">
                <div className="editorial-post-card__author-line">
                  <Text strong className="editorial-post-card__author-name">
                    {post.author}
                  </Text>
                  {isRead ? <CheckCircleOutlined className="editorial-post-card__read-icon" /> : null}
                </div>
                <Text type="secondary" className="editorial-post-card__time">
                  {post.time} • ◔
                </Text>
              </div>
            </Space>

            <Space size="small" className="editorial-post-card__meta">
              <Tooltip title={isRead ? 'Đã đánh dấu đã đọc' : 'Đánh dấu đã đọc'}>
                <Button
                  type="text"
                  className="editorial-post-card__read-toggle"
                  icon={isRead ? <EyeOutlined /> : <CheckCircleOutlined />}
                  onClick={handleReadToggle}
                  disabled={isRead}
                />
              </Tooltip>
              {getCategoryTag()}
            </Space>
          </div>

          <Paragraph className="editorial-post-card__content">{post.content}</Paragraph>

          {renderMediaGrid(post.images || [])}

          <div className="editorial-post-card__actions">
            <Space size="middle" wrap>
              <Tooltip title={isArchivePage ? 'Bỏ lưu trữ' : 'Lưu bài viết'}>
                <Button
                  type="text"
                  danger={isArchivePage}
                  className="editorial-post-card__action-btn"
                  icon={
                    isArchivePage ? (
                      <DeleteOutlined />
                    ) : (
                      <SaveOutlined />
                    )
                  }
                  onClick={handleSaveToggle}
                >
                  {isArchivePage ? 'Bỏ lưu' : 'Lưu trữ'}
                </Button>
              </Tooltip>

              <Tooltip title="Tải ảnh về máy">
                <Button
                  type="text"
                  className="editorial-post-card__action-btn"
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadAll}
                >
                  Tải ảnh ({post.images?.length || 0})
                </Button>
              </Tooltip>
            </Space>

            <Tooltip title="Sao chép văn bản">
              <Button
                type="default"
                className="editorial-post-card__copy-btn"
                icon={<CopyOutlined />}
                onClick={handleCopy}
              >
                Sao chép
              </Button>
            </Tooltip>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default PostCard;
