interface CoverImageProps {
  /** 图片地址：可以是 base64 data URL 或普通 http(s) 图片 URL */
  src?: string | null;
  /** 无图片时的回退 iconfont 图标名 */
  fallbackIcon?: string;
  className?: string;
  style?: React.CSSProperties;
  /** 图片缩放方式，默认 cover 填满容器 */
  fit?: 'cover' | 'contain';
}

/**
 * 套餐/机构配图组件
 * - cover_image 为 base64 data URL 时直接渲染 <img>
 * - 无图时回退到 iconfont 图标（保持原有视觉）
 */
export default function CoverImage({
  src,
  fallbackIcon,
  className = '',
  style,
  fit = 'cover',
}: CoverImageProps) {
  const hasImage = !!src && (src.startsWith('data:image') || src.startsWith('http'));

  if (!hasImage) {
    if (!fallbackIcon) {
      return <div className={`${className} bg-primary-50`} style={style} />;
    }
    return (
      <div className={`${className} bg-primary-50 flex items-center justify-center`} style={style}>
        <svg className="icon" aria-hidden="true" style={{ width: '40%', height: '40%', fill: '#3a8e59' }}>
          <use xlinkHref={`#icon-${fallbackIcon}`} />
        </svg>
      </div>
    );
  }

  return (
    <div className={`${className} overflow-hidden bg-primary-50`} style={style}>
      <img
        src={src}
        alt=""
        loading="lazy"
        className="w-full h-full"
        style={{ objectFit: fit, objectPosition: 'center' }}
      />
    </div>
  );
}
