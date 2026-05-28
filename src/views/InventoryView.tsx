import React, { useState } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { SummaryCard } from '../components/SummaryCard';
import { Button } from '../components/ui/button';
import { AddItemForm } from '../components/AddItemForm';
import { Plus } from 'lucide-react';
import { CATEGORY_ORDER } from '../constants';

export function InventoryView() {
  const { items, categories, removeCategory } = useWardrobe();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const sortedCategories = [...categories].sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a);
    const indexB = CATEGORY_ORDER.indexOf(b);
    
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-medium text-stone-900">My Wardrobe</h1>
          <p className="text-stone-500 mt-1">
            Total Items: <span className="font-mono font-bold text-stone-900">{items.reduce((sum, i) => sum + (i.quantity || 1), 0)}</span>
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      {/* Categories Grid */}
      {items.length === 0 ? (
        <div className="text-center py-20 bg-stone-50 rounded-xl border border-dashed border-stone-200">
          <p className="text-stone-500 mb-4">Your wardrobe is empty.</p>
          <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>Start Adding Clothes</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCategories.map((category) => (
            <SummaryCard
              key={category}
              title={category}
              items={items.filter((i) => i.category === category)}
              groupBy="subCategory"
              onDelete={() => removeCategory(category)}
              deleteTitle="Delete Category"
              deleteMessage={`Are you sure you want to delete the category "${category}"? This will remove all items in it.`}
            />
          ))}
        </div>
      )}

      {isAddModalOpen && <AddItemForm onClose={() => setIsAddModalOpen(false)} />}
    </div>
  );
}
