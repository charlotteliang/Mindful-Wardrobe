import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { WardrobeItem } from '../types';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';
import { useWardrobe } from '../context/WardrobeContext';
import { ConfirmationModal } from './ConfirmationModal';

interface SummaryCardProps {
  title: string;
  items: WardrobeItem[];
  groupBy: 'subCategory' | 'category';
  onDelete?: () => Promise<void>;
  deleteTitle?: string;
  deleteMessage?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ 
  title, 
  items, 
  groupBy,
  onDelete,
  deleteTitle = "Delete Items",
  deleteMessage = "Are you sure you want to delete these items?"
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  // Group items by specified field and sum quantities
  const groups = items.reduce((acc, item) => {
    const key = item[groupBy];
    acc[key] = (acc[key] || 0) + (item.quantity || 1);
    return acc;
  }, {} as Record<string, number>);

  const totalItems = items.reduce((sum, i) => sum + (i.quantity || 1), 0);

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full hover:shadow-md transition-shadow duration-200 group relative">
        {onDelete && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
             <Button 
               variant="ghost" 
               size="icon" 
               className="h-8 w-8 text-stone-400 hover:text-red-500 hover:bg-red-50"
               onClick={() => setIsConfirmOpen(true)}
               title={deleteTitle}
             >
               <Trash2 className="h-4 w-4" />
             </Button>
          </div>
        )}
        <CardHeader className="pb-2">
          <div className="flex justify-between items-baseline pr-8">
            <CardTitle className="text-xl font-serif italic">{title}</CardTitle>
            <span className="text-2xl font-bold text-stone-900">{totalItems}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(groups)
              .sort(([, a], [, b]) => b - a)
              .map(([groupName, count]: [string, number]) => (
                <div key={groupName} className="flex justify-between text-sm items-center">
                <span className="text-stone-600">{groupName}</span>
                <div className="flex items-center gap-2">
                   <div className="h-1.5 w-24 bg-stone-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-stone-800 rounded-full" 
                        style={{ width: `${(count / totalItems) * 100}%` }}
                      />
                   </div>
                   <span className="font-mono text-xs w-4 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {onDelete && (
        <ConfirmationModal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleDelete}
          title={deleteTitle}
          message={deleteMessage}
          confirmText="Delete All Items"
        />
      )}
    </motion.div>
  );
}
