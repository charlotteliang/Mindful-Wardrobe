import React, { useRef, useState } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { Button } from './ui/button';
import { X, Download, Upload, FileJson, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { WardrobeItem, UseCase } from '../types';

interface DataManagementDialogProps {
  onClose: () => void;
}

export function DataManagementDialog({ onClose }: DataManagementDialogProps) {
  const { items, importItems, isImporting: contextIsImporting } = useWardrobe();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<'json' | 'csv' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const combinedProcessing = isProcessing || contextIsImporting;

  const handleExportJSON = () => {
    setIsProcessing(true);
    try {
      const dataStr = JSON.stringify(items, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `wardrobe-backup-${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      setSuccess('JSON export started!');
    } catch (err) {
      setError('Failed to export JSON');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCSV = () => {
    setIsProcessing(true);
    try {
      // Define headers based on table view
      const headers = ['Category', 'Sub Category', 'Brand', 'Color', 'Pattern', 'Qty', 'Use Case', 'Tags', 'ID', 'Created At'];
      
      // Convert items to CSV rows
      const rows = items.map(item => {
        return [
          `"${item.category}"`, // Quote strings to handle commas
          `"${item.subCategory}"`,
          `"${item.brand || ''}"`,
          `"${item.color}"`,
          `"${item.pattern || 'Solid'}"`,
          item.quantity || 1,
          `"${item.useCases?.join('|') || ''}"`, // Join array with pipe
          `"${item.tags?.join('|') || ''}"`,
          item.id,
          item.createdAt
        ].join(',');
      });
      
      const csvContent = [headers.join(','), ...rows].join('\n');
      const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csvContent);
      
      const exportFileDefaultName = `wardrobe-export-${new Date().toISOString().slice(0, 10)}.csv`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      setSuccess('CSV export started!');
    } catch (err) {
      setError('Failed to export CSV');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportClick = (mode: 'json' | 'csv') => {
    setImportMode(mode);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    
    try {
      const text = await file.text();
      
      if (importMode === 'json') {
        const data = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error('Invalid JSON: Root must be an array');
        
        // Very basic validation - the context will sanitize the rest
        const valid = data.every(i => i.category && i.subCategory && i.color);
        if (!valid) throw new Error('Invalid JSON: Missing required fields in some items (Category, SubCategory, Color)');
        
        await importItems(data as WardrobeItem[], 'replace');
        setSuccess(`Successfully imported ${data.length} items from JSON!`);
      } 
      else if (importMode === 'csv') {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length < 2) throw new Error('Invalid CSV: No data found');
        
        // Case-insensitive header matching
        const rawHeaders = lines[0].split(',').map(h => h.trim());
        const headers = rawHeaders.map(h => h.toLowerCase());
        
        const requiredHeaders = ['category', 'sub category', 'color'];
        if (!requiredHeaders.every(h => headers.includes(h))) {
           throw new Error(`Invalid CSV: Missing required columns (Category, Sub Category, Color)`);
        }

        const newItems: WardrobeItem[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values: string[] = [];
          let inQuote = false;
          let currentVal = '';
          for (const char of lines[i]) {
            if (char === '"') {
              inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
              values.push(currentVal);
              currentVal = '';
            } else {
              currentVal += char;
            }
          }
          values.push(currentVal);

          const cleanValues = values.map(v => v.trim().replace(/^"|"$/g, ''));
          
          const item: any = {};
          // Map values back to correct internal keys (camelCase)
          rawHeaders.forEach((h, index) => {
             if (index >= cleanValues.length) return;
             
             const lowerH = h.toLowerCase().replace(/\s/g, '');
             let key = h;
             if (lowerH === 'category') key = 'category';
             else if (lowerH === 'subcategory') key = 'subCategory';
             else if (lowerH === 'brand') key = 'brand';
             else if (lowerH === 'color') key = 'color';
             else if (lowerH === 'pattern') key = 'pattern';
             else if (lowerH === 'quantity' || lowerH === 'qty') key = 'quantity';
             else if (lowerH === 'usecase' || lowerH === 'usecases') key = 'useCases';
             else if (lowerH === 'tag' || lowerH === 'tags') key = 'tags';
             else if (lowerH === 'createdat') key = 'createdAt';
             else if (lowerH === 'id') key = 'id';
             
             item[key] = cleanValues[index];
          });

          // Reconstruct fields and ensure types
          if (!item.id) {
            item.id = typeof crypto?.randomUUID === 'function' 
              ? crypto.randomUUID() 
              : Math.random().toString(36).substring(2) + Date.now().toString(36);
          }
          
          item.category = item.category || 'Uncategorized';
          item.subCategory = item.subCategory || 'Other';
          item.color = item.color || 'Unknown';

          // Ensure createdAt is a number
          if (item.createdAt) {
            const parsedDate = Number(item.createdAt);
            item.createdAt = isNaN(parsedDate) ? Date.now() : parsedDate;
          } else {
            item.createdAt = Date.now();
          }

          // Ensure pattern is valid or default to 'Solid'
          const validPatterns = ['Solid', 'Stripes', 'Florals', 'Plaids', 'Herringbone', 'Polka Dots', 'Checked', 'Sparkles'];
          if (!item.pattern || !validPatterns.includes(item.pattern)) {
            item.pattern = 'Solid';
          }

          // Ensure quantity is a number
          if (item.quantity !== undefined) {
            const parsedQty = Number(item.quantity);
            item.quantity = isNaN(parsedQty) ? 1 : Math.max(1, parsedQty);
          } else {
            item.quantity = 1;
          }
          
          // Handle useCases (Strictly typed)
          const validUseCases = ['Work', 'Fun', 'Active', 'Lounge Wear'];
          if (item.useCases) {
            const parsed = item.useCases.split('|')
              .map((uc: string) => uc.trim())
              .filter((uc: string) => validUseCases.includes(uc));
            item.useCases = parsed.length > 0 ? parsed : ['Work'];
          } else {
            item.useCases = ['Work'];
          }

          // Handle tags
          if (item.tags) {
            item.tags = item.tags.split('|').map((t: string) => t.trim()).filter((t: string) => t);
          } else {
            item.tags = [];
          }

          newItems.push(item as WardrobeItem);
        }
        
        await importItems(newItems, 'replace');
        setSuccess(`Successfully imported ${newItems.length} items from CSV!`);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to import file');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Data Management</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6 relative min-h-[300px]">
          {combinedProcessing && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] z-20 flex items-center justify-center rounded-xl">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
                <span className="text-sm font-medium text-stone-600">Processing...</span>
              </div>
            </div>
          )}
          
          {/* Export Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider">Export Data</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={handleExportJSON}>
                <FileJson className="h-6 w-6 text-stone-700" />
                <div className="text-center">
                  <span className="block font-medium">Backup (JSON)</span>
                  <span className="text-xs text-stone-500">Full data preservation</span>
                </div>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={handleExportCSV}>
                <FileSpreadsheet className="h-6 w-6 text-green-700" />
                <div className="text-center">
                  <span className="block font-medium">Spreadsheet (CSV)</span>
                  <span className="text-xs text-stone-500">Edit in Excel/Sheets</span>
                </div>
              </Button>
            </div>
          </div>

          <div className="border-t border-stone-100" />

          {/* Import Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider">Import Data</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => handleImportClick('json')}>
                <Upload className="h-6 w-6 text-stone-700" />
                <div className="text-center">
                  <span className="block font-medium">Restore Backup</span>
                  <span className="text-xs text-stone-500">From JSON file</span>
                </div>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => handleImportClick('csv')}>
                <Upload className="h-6 w-6 text-green-700" />
                <div className="text-center">
                  <span className="block font-medium">Import Spreadsheet</span>
                  <span className="text-xs text-stone-500">From CSV file</span>
                </div>
              </Button>
            </div>
            <p className="text-xs text-red-500 text-center px-4 font-medium">
              Warning: Importing will overwrite all existing items in your wardrobe.
            </p>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 text-green-700 text-sm rounded-md flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept={importMode === 'json' ? '.json' : '.csv'}
          onChange={handleFileChange}
        />

        <div className="mt-6 pt-4 border-t border-stone-100 flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </motion.div>
    </div>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
