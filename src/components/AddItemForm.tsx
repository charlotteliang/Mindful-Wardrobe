import React, { useState, useMemo, useEffect } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { UseCase, WardrobeItem } from '../types';
import { X, Check, Plus, Palette } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { PRESET_COLORS } from '../constants';

interface AddItemFormProps {
  onClose: () => void;
  initialItem?: WardrobeItem;
}

const MAX_PALETTE_SIZE = 23;

export function AddItemForm({ onClose, initialItem }: AddItemFormProps) {
  const { addItem, updateItem, categories, items } = useWardrobe();
  const [category, setCategory] = useState(initialItem?.category || '');
  const [isNewCategory, setIsNewCategory] = useState(false);
  
  const [subCategory, setSubCategory] = useState(initialItem?.subCategory || '');
  const [isNewSubCategory, setIsNewSubCategory] = useState(false);
  
  const [useCases, setUseCases] = useState<UseCase[]>(() => {
    const initial = initialItem?.useCases || ['Work'];
    // Filter out any legacy tags that are no longer in our UseCase type
    const validUseCases: UseCase[] = ['Work', 'Fun', 'Active', 'Lounge Wear'];
    return initial.filter(uc => validUseCases.includes(uc as any)) as UseCase[];
  });
  
  const [brand, setBrand] = useState(initialItem?.brand || '');
  const [isNewBrand, setIsNewBrand] = useState(false);
  
  const [color, setColor] = useState(initialItem?.color || '');
  const [isCustomColor, setIsCustomColor] = useState(false);
  const [pattern, setPattern] = useState<WardrobeItem['pattern']>(initialItem?.pattern || 'Solid');
  const [quantity, setQuantity] = useState(initialItem?.quantity || 1);
  const [tags, setTags] = useState<string[]>(initialItem?.tags || []);
  const [tagInput, setTagInput] = useState('');

  // Derive all unique tags from existing items
  const allExistingTags = useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach(item => {
      item.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [items]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derive available sub-categories based on selected category
  const availableSubCategories = useMemo(() => {
    if (!category || isNewCategory) return [];
    const subs = items
      .filter(i => i.category === category)
      .map(i => i.subCategory);
    return Array.from(new Set(subs)).sort();
  }, [category, isNewCategory, items]);

  // Derive available brands from all items
  const availableBrands = useMemo(() => {
    const brands = items
      .map(i => i.brand)
      .filter((b): b is string => !!b);
    return Array.from(new Set(brands)).sort();
  }, [items]);

  // Dynamic Palette Logic
  const palette = useMemo(() => {
    // 1. Count usage of all colors in wardrobe
    const counts: Record<string, number> = {};
    items.forEach(i => {
      counts[i.color] = (counts[i.color] || 0) + 1;
    });

    // 2. Sort used colors by frequency
    const sortedUsedColors = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

    return sortedUsedColors.slice(0, MAX_PALETTE_SIZE);
  }, [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (useCases.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (initialItem) {
        await updateItem(initialItem.id, {
          category,
          subCategory,
          useCases,
          brand: brand || "", // Ensure brand is at least an empty string, not undefined
          color,
          pattern,
          quantity,
          tags,
        });
      } else {
        await addItem({
          category,
          subCategory,
          useCases,
          brand: brand || "", // Ensure brand is at least an empty string, not undefined
          color,
          pattern,
          quantity,
          tags,
        });
      }
      onClose();
    } catch (err) {
      console.error("Failed to save item:", err);
      let message = "Failed to save item. Please try again.";
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.error && parsed.error.includes("insufficient permissions")) {
            message = "Permission denied. Please check your access.";
          }
        } catch {
          message = err.message;
        }
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryChange = (val: string) => {
    if (val === 'NEW') {
      setIsNewCategory(true);
      setCategory('');
      setSubCategory('');
      setIsNewSubCategory(true);
    } else {
      setCategory(val);
      setIsNewCategory(false);
      setSubCategory('');
      setIsNewSubCategory(false);
    }
  };

  const handleSubCategoryChange = (val: string) => {
    if (val === 'NEW') {
      setIsNewSubCategory(true);
      setSubCategory('');
    } else {
      setSubCategory(val);
      setIsNewSubCategory(false);
    }
  };

  const handleBrandChange = (val: string) => {
    if (val === 'NEW') {
      setIsNewBrand(true);
      setBrand('');
    } else {
      setBrand(val);
      setIsNewBrand(false);
    }
  };

  const toggleUseCase = (uc: UseCase) => {
    setUseCases(prev => 
      prev.includes(uc) 
        ? prev.filter(c => c !== uc)
        : [...prev, uc]
    );
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Helper to get background style for a color name
  const getColorStyle = (colorName: string) => {
    const preset = PRESET_COLORS.find(p => p.name.toLowerCase() === colorName.toLowerCase());
    return preset ? preset.value : colorName;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{initialItem ? 'Edit Item' : 'Add New Item'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            {!isNewCategory && categories.length > 0 ? (
              <div className="flex gap-2">
                <select
                  id="category"
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950"
                  required
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="NEW">+ Create New Category</option>
                </select>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Tops, Bottoms, Shoes"
                  required
                  autoFocus
                />
                {categories.length > 0 && (
                  <Button type="button" variant="ghost" onClick={() => setIsNewCategory(false)}>
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Sub-Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="subCategory">Sub Category</Label>
            {!isNewSubCategory && availableSubCategories.length > 0 ? (
               <div className="flex gap-2">
                <select
                  id="subCategory"
                  value={subCategory}
                  onChange={(e) => handleSubCategoryChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950"
                  required
                >
                  <option value="" disabled>Select a sub-category</option>
                  {availableSubCategories.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="NEW">+ Create New Sub-Category</option>
                </select>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  id="subCategory"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  placeholder="e.g. Cashmere Sweater, Jeans"
                  required
                />
                {availableSubCategories.length > 0 && (
                  <Button type="button" variant="ghost" onClick={() => setIsNewSubCategory(false)}>
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Use Cases</Label>
            <div className="flex flex-wrap gap-2">
              {(['Work', 'Fun', 'Active', 'Lounge Wear'] as UseCase[]).map((uc) => (
                <button
                  key={uc}
                  type="button"
                  onClick={() => toggleUseCase(uc)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                    useCases.includes(uc)
                      ? "bg-stone-900 text-white border-stone-900"
                      : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
                  )}
                >
                  {uc}
                </button>
              ))}
            </div>
            {useCases.length === 0 && (
              <p className="text-xs text-red-500">Please select at least one use case.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">Brand (Optional)</Label>
            {!isNewBrand && availableBrands.length > 0 ? (
              <div className="flex gap-2">
                <select
                  id="brand"
                  value={brand}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950"
                >
                  <option value="">-- None --</option>
                  {availableBrands.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                  <option value="NEW">+ Create New Brand</option>
                </select>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  id="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Uniqlo"
                />
                {availableBrands.length > 0 && (
                  <Button type="button" variant="ghost" onClick={() => setIsNewBrand(false)}>
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Color</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              {palette.map((cName) => (
                <button
                  key={cName}
                  type="button"
                  onClick={() => {
                    setColor(cName);
                    setIsCustomColor(false);
                  }}
                  className={cn(
                    "h-10 w-10 rounded-full shadow-sm transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 border border-stone-200",
                    color === cName && !isCustomColor ? "ring-2 ring-stone-900 ring-offset-2 scale-110" : ""
                  )}
                  style={{ backgroundColor: getColorStyle(cName) }}
                  title={cName}
                  aria-label={`Select color ${cName}`}
                >
                  {color === cName && !isCustomColor && (
                    <Check className={cn("mx-auto h-4 w-4 drop-shadow-md", ["White", "Beige", "Yellow"].includes(cName) ? "text-stone-900" : "text-white")} />
                  )}
                </button>
              ))}
              
              <button
                type="button"
                onClick={() => {
                  setIsCustomColor(true);
                  // Don't clear color immediately if they are just switching mode, 
                  // but if they click this, they likely want to enter something new.
                  // Let's keep previous color as starting point if it was custom.
                }}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 shadow-sm transition-all hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2",
                  isCustomColor ? "ring-2 ring-stone-900 ring-offset-2 border-stone-900 text-stone-900" : ""
                )}
                title="Custom Color"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            {isCustomColor && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 pt-2"
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-stone-200 shadow-sm">
                   <input 
                      type="color" 
                      className="absolute -top-1/2 -left-1/2 h-[200%] w-[200%] cursor-pointer p-0 border-0"
                      value={color.startsWith('#') ? color : '#000000'}
                      onChange={(e) => setColor(e.target.value)}
                   />
                </div>
                <Input
                  id="customColor"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Color name or hex..."
                  required={isCustomColor}
                  autoFocus
                />
              </motion.div>
            )}
            {!isCustomColor && color && (
               <p className="text-sm text-stone-500">Selected: <span className="font-medium text-stone-900">{color}</span></p>
            )}
          </div>

          {/* Pattern Selection */}
          <div className="space-y-2">
            <Label>Pattern</Label>
            <div className="flex flex-wrap gap-2">
              {(['Solid', 'Stripes', 'Florals', 'Plaids', 'Herringbone', 'Polka Dots', 'Checked', 'Sparkles'] as WardrobeItem['pattern'][]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPattern(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all border",
                    pattern === p
                      ? "bg-stone-900 text-white border-stone-900"
                      : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (Seasonal, Activity, etc.)</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="e.g. Winter, Golf, Yoga"
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-stone-100 text-stone-700 text-xs font-medium border border-stone-200"
                  >
                    {tag}
                    <button 
                      type="button" 
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {allExistingTags.length > 0 && allExistingTags.some(tag => !tags.includes(tag)) && (
              <div className="flex flex-wrap gap-1 mt-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-stone-400 w-full mb-1">Suggestions</p>
                {allExistingTags
                  .filter(tag => !tags.includes(tag))
                  .map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setTags([...tags, tag])}
                      className="px-2 py-1 rounded-md bg-stone-50 text-stone-500 text-[10px] border border-stone-200 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Quantity Selection */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <div className="flex items-center gap-3">
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 rounded-full"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </Button>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center font-mono font-bold text-lg"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 rounded-full"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </Button>
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            {error && (
              <p className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-100">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  initialItem ? 'Save Changes' : 'Add Item'
                )}
              </Button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
