"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Navigation optimization hooks and utilities
export function useNavigationOptimization() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationStart, setNavigationStart] = useState<number | null>(null);

  useEffect(() => {
    // Detect navigation start
    const handleNavigationStart = () => {
      setIsNavigating(true);
      setNavigationStart(Date.now());
    };

    // Detect navigation end
    const handleNavigationEnd = () => {
      setIsNavigating(false);
      if (navigationStart) {
        const duration = Date.now() - navigationStart;
        console.log(`Navigation took ${duration}ms`);
        setNavigationStart(null);
      }
    };

    // Listen for navigation events
    if (typeof window !== 'undefined') {
      // Start navigation detection
      const startDetection = () => {
        handleNavigationStart();
        setTimeout(handleNavigationEnd, 100); // Fallback timeout
      };

      // Listen for route changes
      window.addEventListener('beforeunload', startDetection);
      
      return () => {
        window.removeEventListener('beforeunload', startDetection);
      };
    }
  }, [pathname, navigationStart]);

  return { isNavigating, navigationStart };
}

// Preload critical routes
export function preloadCriticalRoutes() {
  if (typeof window !== 'undefined') {
    const criticalRoutes = [
      '/',
      '/transactions',
      '/accounts',
      '/stats',
      '/budgets',
      '/goals'
    ];

    // Preload routes in background
    setTimeout(() => {
      criticalRoutes.forEach(route => {
        fetch(route, { method: 'HEAD' }).catch(() => {
          // Ignore errors, just trying to warm up the server
        });
      });
    }, 2000); // Start after 2 seconds
  }
}

// Optimized navigation component
export function NavigationOptimizer({ children }: { children: React.ReactNode }) {
  const { isNavigating } = useNavigationOptimization();

  useEffect(() => {
    preloadCriticalRoutes();
  }, []);

  return (
    <div className={`transition-opacity duration-150 ${isNavigating ? 'opacity-75' : 'opacity-100'}`}>
      {children}
    </div>
  );
}
