import React from 'react';
import { Search } from 'lucide-react';
import type { StageDefinition } from '@support-hub/shared-types';

interface TicketFiltersProps {
  stages: StageDefinition[];
  selectedStage: string;
  onSelectStage: (stageId: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
}

export const TicketFilters: React.FC<TicketFiltersProps> = ({
  stages,
  selectedStage,
  onSelectStage,
  search,
  onSearchChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-0 p-2 rounded-xl border border-border shadow-2xs">
      {/* Stage Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <button
          type="button"
          onClick={() => onSelectStage('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
            selectedStage === 'all'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'bg-surface-1 hover:bg-surface-2 text-text-secondary hover:text-text-primary'
          }`}
        >
          All Tickets
        </button>

        {stages.map((stage) => {
          const isSelected = selectedStage === stage.id;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onSelectStage(stage.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-500/20 shadow-2xs font-bold'
                  : 'bg-surface-1 hover:bg-surface-2 text-text-secondary hover:text-text-primary'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full ring-2 ring-white/60 shrink-0"
                style={{ backgroundColor: stage.color }}
              />
              <span>{stage.name}</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative min-w-[240px] sm:w-64">
        <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search ticket #, email, note..."
          className="w-full text-xs pl-8 pr-3 py-1.5 bg-surface-1 border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:bg-surface-0 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-2xs"
        />
      </div>
    </div>
  );
};
