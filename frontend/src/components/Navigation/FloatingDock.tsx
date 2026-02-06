import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  icon?: React.ReactNode;
}

interface FloatingDockProps {
  items: NavItem[];
  primaryAction?: {
    to: string;
    label: string;
  };
  extraActions?: React.ReactNode;
}

/**
 * 悬浮导航底座组件
 */
export function FloatingDock({ items, primaryAction, extraActions }: FloatingDockProps) {
  const location = useLocation();

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* 毛玻璃底座 */}
      <nav 
        className="flex items-center gap-1 px-2 py-2 rounded-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {items.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`
                relative px-4 py-2 text-sm font-light tracking-wide rounded-xl
                transition-all duration-300
                ${isActive 
                  ? 'text-white' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }
              `}
            >
              <span className="flex items-center gap-2">
                {item.icon}
                {item.label}
              </span>
              {/* 选中状态的发光光点 */}
              {isActive && (
                <span 
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white"
                  style={{
                    boxShadow: '0 0 8px rgba(255,255,255,0.8), 0 0 16px rgba(255,255,255,0.4)',
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* 额外操作按钮 */}
      {extraActions}

      {/* 主要操作按钮 - 极光渐变 */}
      {primaryAction && (
        <Link
          to={primaryAction.to}
          className="aurora-btn px-5 py-2.5 text-sm font-medium text-white rounded-xl"
        >
          {primaryAction.label}
        </Link>
      )}
    </div>
  );
}
