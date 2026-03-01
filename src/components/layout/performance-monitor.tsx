"use client";

import { useEffect, useState } from "react";

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    navigationTime: 0,
    renderTime: 0,
    lastNavigation: null as string | null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Monitor navigation performance
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          const navigationTime = navEntry.loadEventEnd - navEntry.loadEventStart;
          
          setMetrics(prev => ({
            ...prev,
            navigationTime,
            lastNavigation: new Date().toISOString(),
          }));
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['navigation'] });
    } catch (e) {
      // PerformanceObserver might not be available
      console.log('Performance monitoring not available');
    }

    return () => observer.disconnect();
  }, []);

  // Log performance metrics in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && metrics.navigationTime > 0) {
      console.log(`🚀 Navigation Performance: ${metrics.navigationTime}ms`);
    }
  }, [metrics]);

  return null; // This component doesn't render anything
}

// Hook to measure component render time
export function useRenderTime(componentName: string) {
  const [renderTime, setRenderTime] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const time = endTime - startTime;
      setRenderTime(time);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ ${componentName} render time: ${time.toFixed(2)}ms`);
      }
    };
  });

  return renderTime;
}
