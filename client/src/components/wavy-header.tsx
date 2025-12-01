import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface WavyHeaderProps {
  title?: string;
  onBack?: () => void;
  rightContent?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function WavyHeader({ 
  title, 
  onBack, 
  rightContent,
  size = 'md' 
}: WavyHeaderProps) {
  const heightMap = {
    sm: '80px',
    md: '100px',
    lg: '140px'
  };

  const viewBoxMap = {
    sm: '-50 0 1380 100',
    md: '-50 0 1380 110',
    lg: '-50 0 1380 130'
  };

  const pathMap = {
    sm: {
      main: 'M-50,50 Q315,0 665,50 T1365,50 L1365,0 L-50,0 Z',
      flowing: 'M-50,65 Q315,30 665,65 T1365,65 Q1035,95 665,80 Q295,65 -50,85 Z',
      accent: 'M-50,90 Q315,65 665,90 T1365,90'
    },
    md: {
      main: 'M-50,55 Q315,5 665,55 T1365,55 L1365,0 L-50,0 Z',
      flowing: 'M-50,75 Q315,35 665,75 T1365,75 Q1035,110 665,90 Q295,75 -50,95 Z',
      accent: 'M-50,105 Q315,75 665,105 T1365,105'
    },
    lg: {
      main: 'M-50,60 Q315,0 665,60 T1365,60 L1365,0 L-50,0 Z',
      flowing: 'M-50,80 Q315,40 665,80 T1365,80 Q1035,120 665,100 Q295,80 -50,100 Z',
      accent: 'M-50,120 Q315,90 665,120 T1365,120'
    }
  };

  const paddingMap = {
    sm: 'py-3 px-4',
    md: 'py-4 px-6',
    lg: 'py-6 px-6'
  };

  const paths = pathMap[size];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative z-10"
    >
      {/* Wavy SVG Background */}
      <svg 
        className="w-full" 
        viewBox={viewBoxMap[size]} 
        preserveAspectRatio="none" 
        style={{ height: heightMap[size], overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#4CAF50', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#45a049', stopOpacity: 0.3 }} />
          </linearGradient>
        </defs>
        
        {/* Main wave fill */}
        <path d={paths.main} fill="#4CAF50" />
        
        {/* Flowing curves */}
        <path
          d={paths.flowing}
          fill="rgba(76, 175, 80, 0.4)"
          opacity="0.6"
        />
        
        {/* Accent curves */}
        <path
          d={paths.accent}
          stroke="#4CAF50"
          strokeWidth="2"
          fill="none"
          opacity="0.5"
        />
      </svg>

      {/* Content Overlay */}
      <div className={`absolute top-0 left-0 right-0 flex items-center justify-between ${paddingMap[size]}`}>
        {onBack && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="material-icons text-gray-800 dark:text-gray-200 mr-3 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
          >
            arrow_back
          </motion.button>
        )}
        {title && (
          <h1 className="text-gray-800 dark:text-gray-200 font-semibold drop-shadow-lg flex-1" 
            style={{ fontSize: size === 'sm' ? '14px' : size === 'md' ? '16px' : '18px' }}>
            {title}
          </h1>
        )}
        {rightContent && (
          <div className="ml-auto">
            {rightContent}
          </div>
        )}
      </div>
    </motion.div>
  );
}
