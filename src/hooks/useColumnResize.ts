import { useRef, useCallback, useEffect } from 'react';
import type React from 'react';
import type { GridColDef } from '../types';

export function useColumnResize<T>(setCols: React.Dispatch<React.SetStateAction<GridColDef<T>[]>>) {
  const resizingRef = useRef<{ field: string; startX: number; startWidth: number } | null>(null);
  const activeListenersRef = useRef<{ move: (e: MouseEvent) => void; up: () => void } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent, field: string, width: number) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = { field, startX: e.clientX, startWidth: width };

    const onMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const { field, startX, startWidth } = resizingRef.current;
      const diff = e.clientX - startX;
      setCols(prev => prev.map(c => c.field === field ? { ...c, width: Math.max(50, startWidth + diff) } : c));
    };

    const onUp = () => {
      resizingRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      activeListenersRef.current = null;
    };

    activeListenersRef.current = { move: onMove, up: onUp };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [setCols]);

  // Clean up any lingering listeners if the component unmounts mid-drag
  useEffect(() => {
    return () => {
      if (activeListenersRef.current) {
        document.removeEventListener('mousemove', activeListenersRef.current.move);
        document.removeEventListener('mouseup', activeListenersRef.current.up);
      }
    };
  }, []);

  return { handleMouseDown };
}
