import { useEffect, useRef } from 'react';

export function useScrollReveal<T extends HTMLElement>(refreshKey = 0) {
  const rootRef = useRef<T>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const targets = root.querySelectorAll<HTMLElement>('[data-scroll-reveal]');
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    root.dataset.scrollMotion = 'ready';
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [refreshKey]);

  return rootRef;
}
