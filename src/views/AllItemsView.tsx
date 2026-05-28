import React, { useState, useMemo } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { AddItemForm } from '../components/AddItemForm';
import { ManageBrandsDialog } from '../components/ManageBrandsDialog';
import { DataManagementDialog } from '../components/DataManagementDialog';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { WardrobeItem, UseCase } from '../types';
import { Edit2, Trash2, Search, Filter, Tag, Copy, Database, RotateCcw, Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getColorValue } from '../constants';

export function AllItemsView() {
  const { items, removeItem, addItem } = useWardrobe();
  const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDataManagementOpen, setIsDataManagementOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [useCaseFilter, setUseCaseFilter] = useState<UseCase | 'All'>('All');
  const [brandFilter, setBrandFilter] = useState<string | 'All'>('All');
  const [subCategoryFilter, setSubCategoryFilter] = useState<string | 'All'>('All');
  const [tagFilter, setTagFilter] = useState<string | 'All'>('All');
  const [colorFilter, setColorFilter] = useState<string | 'All'>('All');
  const [patternFilter, setPatternFilter] = useState<WardrobeItem['pattern'] | 'All'>('All');
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);

  const uniqueBrands = useMemo(() => {
    const brands = items.map(i => i.brand).filter((b): b is string => !!b);
    return Array.from(new Set(brands)).sort();
  }, [items]);

  const uniqueSubCategories = useMemo(() => {
    const subs = items.map(i => i.subCategory);
    return Array.from(new Set(subs)).sort();
  }, [items]);

  const uniqueTags = useMemo(() => {
    const tags = items.flatMap(i => i.tags || []);
    return Array.from(new Set(tags)).sort();
  }, [items]);

  const uniqueColors = useMemo(() => {
    const colors = items.map(i => i.color);
    return Array.from(new Set(colors)).sort();
  }, [items]);

  const uniquePatterns = useMemo(() => {
    const patterns = items.map(i => i.pattern);
    return Array.from(new Set(patterns)).sort();
  }, [items]);
  
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pattern.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesUseCase = useCaseFilter === 'All' || item.useCases?.includes(useCaseFilter);
    const matchesBrand = brandFilter === 'All' || item.brand === brandFilter;
    const matchesSubCategory = subCategoryFilter === 'All' || item.subCategory === subCategoryFilter;
    const matchesTag = tagFilter === 'All' || item.tags?.includes(tagFilter);
    const matchesColor = colorFilter === 'All' || item.color === colorFilter;
    const matchesPattern = patternFilter === 'All' || item.pattern === patternFilter;
    
    return matchesSearch && matchesUseCase && matchesBrand && matchesSubCategory && matchesTag && matchesColor && matchesPattern;
  }).sort((a, b) => (b.quantity || 1) - (a.quantity || 1));

  const resetFilters = () => {
    setSearchTerm('');
    setUseCaseFilter('All');
    setBrandFilter('All');
    setSubCategoryFilter('All');
    setTagFilter('All');
    setColorFilter('All');
    setPatternFilter('All');
  };

  const isFiltered = searchTerm !== '' || useCaseFilter !== 'All' || brandFilter !== 'All' || subCategoryFilter !== 'All' || tagFilter !== 'All' || colorFilter !== 'All' || patternFilter !== 'All';

  const handleDelete = async () => {
    if (itemToDelete) {
      await removeItem(itemToDelete);
      setItemToDelete(null);
    }
  };

  const handleDuplicate = async (item: WardrobeItem) => {
    const { id, createdAt, ...rest } = item;
    await addItem(rest);
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-serif font-medium text-stone-900">All Items</h1>
        <Button variant="outline" onClick={() => setIsDataManagementOpen(true)} className="gap-2 text-stone-600 border-stone-200">
          <Database className="h-4 w-4" /> Backup / Import
        </Button>
      </div>

      <div className="bg-stone-50/50 p-4 rounded-xl border border-stone-200/60 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              placeholder="Search by color, brand, tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-stone-200 focus:ring-stone-200"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
              <select
                value={useCaseFilter}
                onChange={(e) => setUseCaseFilter(e.target.value as UseCase | 'All')}
                className="pl-9 pr-8 h-10 rounded-lg border border-stone-200 bg-white text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-100 appearance-none min-w-[140px]"
              >
                <option value="All">All Use Cases</option>
                <option value="Work">Work</option>
                <option value="Fun">Fun</option>
                <option value="Active">Active</option>
                <option value="Lounge Wear">Lounge Wear</option>
              </select>
            </div>

            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="pl-9 pr-8 h-10 rounded-lg border border-stone-200 bg-white text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-100 appearance-none min-w-[140px]"
              >
                <option value="All">All Brands</option>
                {uniqueBrands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
              <select
                value={subCategoryFilter}
                onChange={(e) => setSubCategoryFilter(e.target.value)}
                className="pl-9 pr-8 h-10 rounded-lg border border-stone-200 bg-white text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-100 appearance-none min-w-[140px]"
              >
                <option value="All">All Sub Categories</option>
                {uniqueSubCategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="pl-9 pr-8 h-10 rounded-lg border border-stone-200 bg-white text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-100 appearance-none min-w-[140px]"
              >
                <option value="All">All Tags</option>
                {uniqueTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsColorDropdownOpen(!isColorDropdownOpen)}
                  className="flex items-center gap-2 pl-3 pr-8 h-10 rounded-lg border border-stone-200 bg-white text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-100 min-w-[140px] text-left"
                >
                  <Palette className="h-3.5 w-3.5 text-stone-400" />
                  <span className="truncate">
                    {colorFilter === 'All' ? 'All Colors' : colorFilter}
                  </span>
                  {colorFilter !== 'All' && (
                    <div 
                      className="h-3 w-3 rounded-full border border-stone-200 shrink-0" 
                      style={{ backgroundColor: getColorValue(colorFilter) }}
                    />
                  )}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isColorDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsColorDropdownOpen(false)} 
                    />
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-stone-200 rounded-xl shadow-xl z-20 p-3 max-h-80 overflow-y-auto">
                      <div className="grid grid-cols-5 gap-2">
                        <button
                          onClick={() => {
                            setColorFilter('All');
                            setIsColorDropdownOpen(false);
                          }}
                          className={cn(
                            "col-span-5 text-left px-2 py-1.5 rounded-md text-xs font-medium hover:bg-stone-50 transition-colors",
                            colorFilter === 'All' ? "bg-stone-100 text-stone-900" : "text-stone-500"
                          )}
                        >
                          All Colors
                        </button>
                        {uniqueColors.map(color => (
                          <button
                            key={color}
                            onClick={() => {
                              setColorFilter(color);
                              setIsColorDropdownOpen(false);
                            }}
                            className={cn(
                              "group relative h-10 w-10 rounded-full border border-stone-200 shadow-sm transition-all hover:scale-110 focus:outline-none",
                              colorFilter === color ? "ring-2 ring-stone-900 ring-offset-2 scale-110" : ""
                            )}
                            style={{ backgroundColor: getColorValue(color) }}
                            title={color}
                          >
                            <span className="sr-only">{color}</span>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/10 rounded-full transition-opacity">
                              {colorFilter === color && <Check className="h-3 w-3 text-white drop-shadow-sm" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
              <select
                value={patternFilter}
                onChange={(e) => setPatternFilter(e.target.value as WardrobeItem['pattern'] | 'All')}
                className="pl-9 pr-8 h-10 rounded-lg border border-stone-200 bg-white text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-100 appearance-none min-w-[140px]"
              >
                <option value="All">All Patterns</option>
                {['Solid', 'Stripes', 'Florals', 'Plaids', 'Herringbone', 'Polka Dots', 'Checked', 'Sparkles'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {isFiltered && (
              <Button 
                variant="ghost" 
                onClick={resetFilters} 
                className="h-10 px-3 gap-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" /> 
                <span className="text-xs font-medium">Reset Filters</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-md border border-stone-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-stone-50 text-stone-500 font-medium border-b border-stone-200">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Sub Category</th>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3 w-24">Color</th>
                <th className="px-4 py-3">Pattern</th>
                <th className="px-4 py-3 w-20">Qty</th>
                <th className="px-4 py-3">Use Case</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-stone-500">
                    No items found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-stone-900">{item.category}</td>
                    <td className="px-4 py-3">{item.subCategory}</td>
                    <td className="px-4 py-3 text-stone-500">{item.brand || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2" title={item.color}>
                        <div 
                          className="h-10 w-20 rounded-md border border-stone-200 shadow-sm" 
                          style={{ backgroundColor: getColorValue(item.color) }} 
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-600">{item.pattern}</td>
                    <td className="px-4 py-3 font-mono font-bold text-stone-900">
                      {item.quantity || 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {item.useCases?.map(uc => (
                          <span key={uc} className={cn(
                            "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset",
                            uc === 'Work' ? "bg-blue-50 text-blue-700 ring-blue-600/20" :
                            uc === 'Fun' ? "bg-pink-50 text-pink-700 ring-pink-600/20" :
                            uc === 'Active' ? "bg-orange-50 text-orange-700 ring-orange-600/20" :
                            "bg-stone-50 text-stone-700 ring-stone-600/20"
                          )}>
                            {uc}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {item.tags?.map(tag => (
                          <span key={tag} className="inline-flex items-center rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-stone-600 ring-1 ring-inset ring-stone-500/10">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-stone-500 hover:text-stone-900"
                          onClick={() => handleDuplicate(item)}
                          title="Duplicate Item"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-stone-500 hover:text-stone-900"
                          onClick={() => setEditingItem(item)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-stone-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setItemToDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingItem && (
        <AddItemForm 
          initialItem={editingItem} 
          onClose={() => setEditingItem(null)} 
        />
      )}
      
      {isDataManagementOpen && (
        <DataManagementDialog onClose={() => setIsDataManagementOpen(false)} />
      )}

      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}
