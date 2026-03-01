"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

interface PrefetchLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetch?: boolean;
  scroll?: boolean;
}

export function PrefetchLink({ 
  href, 
  children, 
  className, 
  prefetch = true, 
  scroll = false 
}: PrefetchLinkProps) {
  const router = useRouter();
  const [isPrefetched, setIsPrefetched] = useState(false);

  const handleMouseEnter = () => {
    if (prefetch && !isPrefetched) {
      router.prefetch(href);
      setIsPrefetched(true);
    }
  };

  const handleTouchStart = () => {
    if (prefetch && !isPrefetched) {
      router.prefetch(href);
      setIsPrefetched(true);
    }
  };

  const handleFocus = () => {
    if (prefetch && !isPrefetched) {
      router.prefetch(href);
      setIsPrefetched(true);
    }
  };

  return (
    <Link
      href={href}
      prefetch={false} // Disable automatic prefetching, we handle it manually
      scroll={scroll}
      className={className}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleTouchStart}
      onFocus={handleFocus}
      legacyBehavior={false}
    >
      {children}
    </Link>
  );
}
