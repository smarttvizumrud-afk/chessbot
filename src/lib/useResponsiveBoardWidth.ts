import { useEffect, useRef, useState } from 'react';

const MAX_BOARD_WIDTH = 520;
const MIN_BOARD_WIDTH = 220;

export function useResponsiveBoardWidth() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(MIN_BOARD_WIDTH);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    function update() {
      const nextWidth = Math.floor(element?.getBoundingClientRect().width ?? MIN_BOARD_WIDTH);
      setWidth(Math.max(MIN_BOARD_WIDTH, Math.min(MAX_BOARD_WIDTH, nextWidth)));
    }

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return { boardWrapRef: ref, boardWidth: width };
}
