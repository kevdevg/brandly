import { useEffect } from 'react';

/**
 * Global custom tooltip system that replaces native `title` attributes
 * with styled, animated tooltips. Self-contained with no external deps.
 */
export function useCustomTooltips(): void {
  useEffect(() => {
    let tooltipNode: HTMLDivElement | null = null;
    let hoverTimeout: any = null;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || !target.closest) return;
      const titleEl = target.closest('[title]') as HTMLElement;
      
      if (titleEl && titleEl.getAttribute('title')) {
        const title = titleEl.getAttribute('title')!;
        titleEl.setAttribute('data-tooltip', title);
        titleEl.removeAttribute('title');
      }
      
      const validEl = target.closest('[data-tooltip]') as HTMLElement;
      if (validEl) {
        const text = validEl.getAttribute('data-tooltip');
        if (text) {
          hoverTimeout = setTimeout(() => {
            if (!tooltipNode) {
              tooltipNode = document.createElement('div');
              tooltipNode.className = 'fixed z-[9999] px-2 py-1 bg-neutral-800 border border-neutral-700 text-[10px] sm:text-xs text-white rounded pointer-events-none shadow-xl shadow-black/50 whitespace-nowrap opacity-0 transition-opacity duration-150';
              document.body.appendChild(tooltipNode);
            }
            tooltipNode.textContent = text;
            tooltipNode.style.display = 'block';
            
            const rect = validEl.getBoundingClientRect();
            tooltipNode.style.top = `${rect.bottom + 6}px`;
            
            // Adjust left to ensure it doesn't run off screen
            let left = rect.left + (rect.width/2);
            tooltipNode.style.left = `${left}px`;
            tooltipNode.style.transform = `translateX(-50%)`;
            
            // Fade in
            requestAnimationFrame(() => {
              if (tooltipNode) tooltipNode.style.opacity = '1';
            });
          }, 50); // almost instant
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
      if (tooltipNode) {
        tooltipNode.style.opacity = '0';
        setTimeout(() => {
          if (tooltipNode && tooltipNode.style.opacity === '0') {
             tooltipNode.style.display = 'none';
          }
        }, 150); // wait for fade out
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      if (tooltipNode) tooltipNode.remove();
    }
  }, []);
}
