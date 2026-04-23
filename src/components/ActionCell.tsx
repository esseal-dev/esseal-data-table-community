import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 200;

      if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
        setDropdownStyle({ position: 'fixed', bottom: window.innerHeight - rect.top, right: window.innerWidth - rect.right });
      } else {
        setDropdownStyle({ position: 'fixed', top: rect.bottom, right: window.innerWidth - rect.right });
      }
    };

    updatePosition();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        triggerRef.current && !triggerRef.current.contains(target)
      ) onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', onClose, true);
    window.addEventListener('resize', onClose);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', onClose, true);
      window.removeEventListener('resize', onClose);
    };
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
        <div>
          <button
            ref={triggerRef}
            className="dg-action-btn"
            aria-label="More actions"
            aria-haspopup="true"
            aria-expanded={isOpen}
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
          >
            ⋮
          </button>
          {isOpen && createPortal(
            <div ref={menuRef} className="dg-action-dropdown" role="menu" style={dropdownStyle}>
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
            </div>,
            document.body
          )}
        </div>
      )}
    </div>
  );
}
