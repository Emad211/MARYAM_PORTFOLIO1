// Performance Client Component
'use client';

import { useEffect } from 'react';
import { usePerformanceMonitoring } from '@/hooks/use-performance-monitoring';

export const PerformanceMonitor: React.FC = () => {
  usePerformanceMonitoring();
  
  useEffect(() => {
    // اضافه کردن performance marks
    performance.mark('app-start');
    
    return () => {
      performance.mark('app-end');
      performance.measure('app-duration', 'app-start', 'app-end');
    };
  }, []);

  return null;
};