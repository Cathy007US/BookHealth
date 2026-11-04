interface IconProps {
  name: string;       // icon class name without "icon-" prefix, e.g. "shouye"
  className?: string;
  style?: React.CSSProperties;
}

/**
 * SVG symbol iconfont component.
 * Usage: <Icon name="shouye" style={{ color: '#3a8e59', fontSize: 22 }} />
 * Color is controlled by CSS `color` property (inherits from parent).
 */
export default function Icon({ name, className = '', style }: IconProps) {
  return (
    <svg className={`icon ${className}`} aria-hidden="true" style={style}>
      <use xlinkHref={`#icon-${name}`} />
    </svg>
  );
}
