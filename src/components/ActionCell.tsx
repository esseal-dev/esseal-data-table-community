import { useRef, useEffect } from 'react';
import type { GridAction } from '../types';

interface ActionCellProps<T> {
  row: T;
  actions: GridAction<T>[];
  maxVisible: number;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export default function ActionCell<T>({ row, actions, maxVisible, isOpen, onToggle, onClose }: ActionCellProps<T>) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const visible = actions.slice(0, maxVisible);
  const overflow = actions.slice(maxVisible);

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', width: '100%', position: 'relative' }}>
      {visible.map((a, i) => (
        <button
          key={i}
          title={a.tooltipText || a.label}
          aria-label={a.label}
          className="dg-action-btn"
          onClick={(e) => { e.stopPropagation(); a.onClick(row); }}
          disabled={a.disabled}
        >
          {a.icon || a.label}
        </button>
      ))}
      {overflow.length > 0 && (
        <div ref={menuRef}>
          <button
            className="dg-action-btn"
            aria-label="More actions"
            aria-haspopup="true"
            aria-expanded={isOpen}
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
          >
            ⋮
          </button>
          {isOpen && (
            <div className="dg-action-dropdown" role="menu">
              {overflow.map((a, i) => (
                <div
                  key={i}
                  title={a.tooltipText || a.label}
                  className="dg-dropdown-item"
                  role="menuitem"
                  aria-disabled={a.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (a.disabled) return;
                    a.onClick(row);
                    onClose();
                  }}
                >
                  {a.icon} {a.label}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
