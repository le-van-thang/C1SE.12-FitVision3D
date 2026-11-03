import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeId,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1 border-b border-kraft overflow-x-auto select-none ${className}`}>
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-t border-x -mb-[1px] transition-all ${
              isActive
                ? 'bg-paper text-indigo font-bold border-ink border-b-paper shadow-hard-sm'
                : 'bg-paper-2/60 text-ink-2 border-transparent hover:text-ink hover:bg-paper-2'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`text-[10px] font-mono px-1 py-0.2 border ${
                  isActive
                    ? 'bg-indigo text-white border-indigo'
                    : 'bg-kraft/40 text-ink-2 border-kraft'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
