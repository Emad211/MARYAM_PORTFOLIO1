// Performance Monitoring Hook
import { useEffect } from 'react';

interface PerformanceMetrics {
  fcp: number;
  lcp: number;
  cls: number;
  fid: number;
  ttfb: number;
}

export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // اندازه‌گیری First Contentful Paint
    const measureFCP = () => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            console.log('FCP:', entry.startTime);
            // اینجا می‌توانید metrics را به analytics ارسال کنید
          }
        }
      });
      observer.observe({ entryTypes: ['paint'] });
    };

    // اندازه‌گیری Largest Contentful Paint
    const measureLCP = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          console.log('LCP:', lastEntry.startTime);
        }
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    };

    // اندازه‌گیری Cumulative Layout Shift
    const measureCLS = () => {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        console.log('CLS:', clsValue);
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    };

    // اندازه‌گیری Time to First Byte
    const measureTTFB = () => {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        console.log('TTFB:', ttfb);
      }
    };

    // بررسی پشتیبانی از Performance Observer
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      measureFCP();
      measureLCP();
      measureCLS();
      measureTTFB();
    }

    // گزارش خطاهای JavaScript
    const handleError = (event: ErrorEvent) => {
      console.error('JavaScript Error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    };

    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null;
};

// Web Vitals Reporter
export const reportWebVitals = (metric: any) => {
  console.log('Web Vital:', metric);
  
  // اینجا می‌توانید metrics را به Google Analytics یا سرویس analytics دیگری ارسال کنید
  // gtag('event', metric.name, {
  //   value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
  //   event_label: metric.id,
  // });
};