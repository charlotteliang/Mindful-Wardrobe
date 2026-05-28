import React, { useState, useMemo } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { X, Trash2, Edit2, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { ConfirmationModal } from './ConfirmationModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

interface ManageBrandsDialogProps {
  onClose: () => void;
}

export function ManageBrandsDialog({ onClose }: ManageBrandsDialogProps) {
  const { items, deleteBrand, renameBrand } = useWardrobe();
  const [editingBrand, setEditingBrand] = useState<string | null>(null);
  const [newBrandName, setNewBrandName] = useState('');
  const [brandToDelete, setBrandToDelete] = useState<{ name: string, count: number } | null>(null);

  // Derive unique brands and their counts
  const brands = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      if (item.brand) {
        counts[item.brand] = (counts[item.brand] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  const handleRename = async (oldName: string) => {
    if (newBrandName && newBrandName !== oldName) {
      await renameBrand(oldName, newBrandName);
    }
    setEditingBrand(null);
    setNewBrandName('');
  };

  const handleDelete = async () => {
    if (brandToDelete) {
      await deleteBrand(brandToDelete.name);
      setBrandToDelete(null);
    }
  };

  const startEditing = (brand: string) => {
    setEditingBrand(brand);
    setNewBrandName(brand);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl max-h-[80vh] flex flex-col"
      >
        <div className="mb-4 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-semibold">Manage Brands</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          {brands.length === 0 ? (
            <div className="text-center py-8 text-stone-500">
              No brands found in your wardrobe.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand Name</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.map(([brand, count]) => (
                  <TableRow key={brand}>
                    <TableCell className="font-medium">
                      {editingBrand === brand ? (
                        <Input 
                          value={newBrandName}
                          onChange={(e) => setNewBrandName(e.target.value)}
                          className="h-8"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(brand);
                            if (e.key === 'Escape') setEditingBrand(null);
                          }}
                        />
                      ) : (
                        brand
                      )}
                    </TableCell>
                    <TableCell className="text-right text-stone-500">{count}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {editingBrand === brand ? (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleRename(brand)}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-stone-400 hover:text-stone-900"
                            onClick={() => startEditing(brand)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-stone-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setBrandToDelete({ name: brand, count })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-stone-100 flex justify-end shrink-0">
          <Button onClick={onClose}>Done</Button>
        </div>
      </motion.div>

      <ConfirmationModal
        isOpen={!!brandToDelete}
        onClose={() => setBrandToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Brand"
        message={`Are you sure you want to delete the brand "${brandToDelete?.name}"? This will remove the brand from ${brandToDelete?.count} items.`}
        confirmText="Remove Brand"
      />
    </div>
  );
}
