import React, { useState } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { UseCase } from '../types';
import { SummaryCard } from '../components/SummaryCard';
import { cn } from '@/lib/utils';
import { CATEGORY_ORDER } from '../constants';

export function UseCaseView() {
  const { items } = useWardrobe();
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase>('Work');

  const useCases: UseCase[] = ['Work', 'Fun', 'Active', 'Lounge Wear'];
  
  const filteredItems = items.filter(item => item.useCases?.includes(selectedUseCase));
  
  const categoriesInUseCase = Array.from(new Set(filteredItems.map(i => i.category))).sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a);
    const indexB = CATEGORY_ORDER.indexOf(b);
    
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-serif font-medium text-stone-900">Curated by Use Case</h1>
        
        <div className="flex p-1 bg-stone-100 rounded-lg w-fit">
          {useCases.map((uc) => {
            const count = items
              .filter(item => item.useCases?.includes(uc))
              .reduce((sum, i) => sum + (i.quantity || 1), 0);
            return (
              <button
                key={uc}
                onClick={() => setSelectedUseCase(uc)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                  selectedUseCase === uc 
                    ? "bg-white text-stone-900 shadow-sm" 
                    : "text-stone-500 hover:text-stone-900"
                )}
              >
                {uc}
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full transition-colors",
                  selectedUseCase === uc 
                    ? "bg-stone-100 text-stone-600" 
                    : "bg-stone-200 text-stone-500 group-hover:bg-stone-300"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-stone-50 rounded-xl border border-dashed border-stone-200">
          <p className="text-stone-400">No items found for {selectedUseCase}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoriesInUseCase.map((category) => (
            <SummaryCard
              key={category}
              title={category}
              items={filteredItems.filter(i => i.category === category)}
              groupBy="subCategory"
            />
          ))}
        </div>
      )}
    </div>
  );
}
