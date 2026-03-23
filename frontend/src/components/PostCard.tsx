import React from 'react';
import { motion } from 'framer-motion';
import { Card, Avatar, Typography, Space, Button, Tooltip, message, Tag, Image, Row, Col } from 'antd';
import { 
  SaveOutlined, 
  DownloadOutlined, 
  CopyOutlined,
  UserOutlined,
  CalendarOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { Post } from '../data/mockData';

const { Text, Paragraph } = Typography;

interface PostCardProps {
  post: Post;
  isArchivePage?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, isArchivePage = false }) => {
  // Hàm sao chép nội dung bài viết
  const handleCopy = () => {
    navigator.clipboard.writeText(post.content);
    message.success('Đã sao chép nội dung rồi ạ! ✨');
  };

  // Hàm tải ảnh đơn giản, hiệu quả cho cả PC và Mobile
  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error();
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
    } catch (error) {
      window.open(url, '_blank');
      return false;
    }
  };

  const handleDownloadAll = async () => {
    if (post.images && post.images.length > 0) {
      message.loading({ content: 'Đang tải ảnh về máy cậu Chủ... 📥', key: 'downloading' });
      for (let i = 0; i < post.images.length; i++) {
        const url = post.images[i];
        const filename = `BlogAINamLun_${post.id}_${i + 1}.jpg`;
        await downloadImage(url, filename);
        if (post.images.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      message.success({ content: 'Đã tải xong toàn bộ ảnh rồi ạ! ✨', key: 'downloading' });
    } else {
      message.warning('Bài viết này không có ảnh để tải ạ! 😅');
    }
  };

  // Hàm xử lý Lưu trữ / Bỏ lưu trữ dùng LocalStorage
  const handleSaveToggle = () => {
    const savedRaw = localStorage.getItem('blog-saved-posts');
    let saved: Post[] = savedRaw ? JSON.parse(savedRaw) : [];

    if (isArchivePage) {
      // Logic Bỏ lưu
      saved = saved.filter(p => p.id !== post.id);
      localStorage.setItem('blog-saved-posts', JSON.stringify(saved));
      message.success('Đã dọn dẹp bài này khỏi kho lưu trữ rồi ạ! 🧹');
      // Phát sự kiện để trang Archive.tsx biết mà load lại
      window.dispatchEvent(new Event('blog-archive-updated'));
    } else {
      // Logic Lưu mới
      if (saved.find(p => p.id === post.id)) {
        message.warning('Bẩm cậu Chủ, bài này đã có trong kho rồi ạ! 💎');
      } else {
        saved.unshift(post); // Cho lên đầu danh sách
        localStorage.setItem('blog-saved-posts', JSON.stringify(saved));
        message.success('Đã cất bài viết vào kho báu rồi ạ! 💾✨');
      }
    }
  };

  const getCategoryTag = (category: string) => {
    switch (category) {
      case 'fashion': return <Tag color="magenta" icon={<CalendarOutlined />}>Thời trang</Tag>;
      case 'health': return <Tag color="green" icon={<CalendarOutlined />}>Sức khỏe</Tag>;
      case 'tips': return <Tag color="gold" icon={<CalendarOutlined />}>Mẹo Vặt</Tag>;
      default: return <Tag color="blue" icon={<CalendarOutlined />}>Chung</Tag>;
    }
  };

  const renderFacebookLayout = (images: string[]) => {
    const count = images.length;
    if (count === 0) return null;
    const displayImages = images.slice(0, 5);
    const remainingCount = count - 5;

    return (
      <div style={{ margin: '16px -24px', backgroundColor: '#f0f2f5', overflow: 'hidden' }}>
        <Image.PreviewGroup>
          {count === 1 && <Image src={images[0]} style={{ width: '100%', maxHeight: '500px', objectFit: 'cover', display: 'block' }} />}
          {count === 2 && (
            <Row gutter={[2, 2]}>
              {displayImages.map((img, i) => (
                <Col span={12} key={i}><Image src={img} style={{ width: '100%', height: '350px', objectFit: 'cover', display: 'block' }} /></Col>
              ))}
            </Row>
          )}
          {count === 3 && (
            <Row gutter={[2, 2]}>
              <Col span={16}><Image src={images[0]} style={{ width: '100%', height: '400px', objectFit: 'cover', display: 'block' }} /></Col>
              <Col span={8}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <Image src={images[1]} style={{ width: '100%', height: '199px', objectFit: 'cover', display: 'block' }} />
                  <Image src={images[2]} style={{ width: '100%', height: '199px', objectFit: 'cover', display: 'block' }} />
                </div>
              </Col>
            </Row>
          )}
          {count === 4 && (
            <Row gutter={[2, 2]}>
              <Col span={24}><Image src={images[0]} style={{ width: '100%', height: '300px', objectFit: 'cover', display: 'block' }} /></Col>
              {images.slice(1, 4).map((img, i) => (
                <Col span={8} key={i}><Image src={img} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} /></Col>
              ))}
            </Row>
          )}
          {count >= 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <Row gutter={[2, 2]}>
                <Col span={12}><Image src={images[0]} style={{ width: '100%', height: '250px', objectFit: 'cover', display: 'block' }} /></Col>
                <Col span={12}><Image src={images[1]} style={{ width: '100%', height: '250px', objectFit: 'cover', display: 'block' }} /></Col>
              </Row>
              <Row gutter={[2, 2]}>
                <Col span={8}><Image src={images[2]} style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} /></Col>
                <Col span={8}><Image src={images[3]} style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} /></Col>
                <Col span={8} style={{ position: 'relative' }}>
                  <Image src={images[4]} style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
                  {remainingCount > 0 && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px', fontWeight: 'bold', pointerEvents: 'none', zIndex: 1 }}>
                      +{remainingCount}
                    </div>
                  )}
                </Col>
              </Row>
            </div>
          )}
          <div style={{ display: 'none' }}>{images.slice(5).map((img, i) => <Image key={i} src={img} />)}</div>
        </Image.PreviewGroup>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ marginBottom: '32px' }}>
      <Card hoverable style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', background: '#fff' }} bodyStyle={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <Space size="middle">
            <Avatar src={post.avatar} size={54} icon={<UserOutlined />} style={{ border: '2px solid #f0f2f5' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Text strong style={{ fontSize: '17px', color: '#1a1a1a' }}>{post.author}</Text>
              <Text type="secondary" style={{ fontSize: '13px' }}>{post.time} • 🕒</Text>
            </div>
          </Space>
          {getCategoryTag(post.category)}
        </div>
        <Paragraph style={{ fontSize: '16px', color: '#444', lineHeight: '1.7', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>{post.content}</Paragraph>
        {renderFacebookLayout(post.images || [])}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size="large">
            <Tooltip title={isArchivePage ? "Bỏ lưu trữ" : "Lưu bài viết"}>
              <Button 
                type="text" 
                danger={isArchivePage}
                icon={isArchivePage ? <DeleteOutlined /> : <SaveOutlined style={{ fontSize: '20px' }} />} 
                onClick={handleSaveToggle}
              >
                {isArchivePage ? 'Bỏ lưu' : 'Lưu trữ'}
              </Button>
            </Tooltip>
            <Tooltip title="Tải ảnh về máy"><Button type="text" icon={<DownloadOutlined style={{ fontSize: '20px' }} />} onClick={handleDownloadAll}>Tải ảnh ({post.images?.length || 0})</Button></Tooltip>
          </Space>
          <Tooltip title="Sao chép văn bản"><Button type="primary" ghost icon={<CopyOutlined />} onClick={handleCopy} style={{ borderRadius: '20px', fontWeight: '600' }}>Sao chép</Button></Tooltip>
        </div>
      </Card>
    </motion.div>
  );
};

export default PostCard;
