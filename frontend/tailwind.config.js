/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 新渐变极简主义色彩系统
        dream: {
          // 主色调 - 深邃星空
          primary: '#6366f1',      // 靛蓝
          secondary: '#8b5cf6',    // 紫罗兰
          accent: '#a78bfa',       // 淡紫
          
          // 背景色系
          background: '#0a0a1a',   // 深夜星空底色
          surface: '#1a1a2e',      // 表面色
          
          // 文字色系
          text: '#f0f0ff',         // 主文字 - 带微蓝的白
          'text-secondary': '#a0a0c0', // 次要文字
          
          // 荧光点缀色 - Neon Accents
          neon: {
            blue: '#00d4ff',       // 电光蓝
            purple: '#bf00ff',     // 霓虹紫
            cyan: '#00ffd4',       // 青绿
            orange: '#ff6b35',     // 暖橙
            pink: '#ff00aa',       // 霓虹粉
          },
          
          // 毛玻璃效果色
          glass: {
            light: 'rgba(255, 255, 255, 0.08)',
            medium: 'rgba(255, 255, 255, 0.12)',
            dark: 'rgba(0, 0, 0, 0.3)',
            border: 'rgba(255, 255, 255, 0.15)',
            glow: 'rgba(99, 102, 241, 0.3)',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
        '3xl': '64px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'neon-blue': '0 0 20px rgba(0, 212, 255, 0.5), 0 0 40px rgba(0, 212, 255, 0.3)',
        'neon-purple': '0 0 20px rgba(191, 0, 255, 0.5), 0 0 40px rgba(191, 0, 255, 0.3)',
        'neon-cyan': '0 0 20px rgba(0, 255, 212, 0.5), 0 0 40px rgba(0, 255, 212, 0.3)',
        'glow': '0 0 30px rgba(99, 102, 241, 0.4)',
      },
      animation: {
        'gradient-shift': 'gradient-shift 15s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 40px rgba(99, 102, 241, 0.6)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
