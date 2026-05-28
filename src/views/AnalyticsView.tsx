import React, { useMemo, useState } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { getColorValue } from '../constants';
import { Button } from '../components/ui/button';
import { ArrowDownWideNarrow, ArrowUpWideNarrow } from 'lucide-react';

export function AnalyticsView() {
  const { items } = useWardrobe();
  const [showBottomBrands, setShowBottomBrands] = useState(false);

  // Data for Top/Bottom Brands
  const brandData = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      const brand = item.brand || 'Unknown';
      counts[brand] = (counts[brand] || 0) + (item.quantity || 1);
    });

    const sorted = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => showBottomBrands ? a.value - b.value : b.value - a.value);

    return sorted.slice(0, 10);
  }, [items, showBottomBrands]);

  // Stats for summary
  const stats = useMemo(() => {
    const brands = new Set(items.map(i => i.brand).filter(Boolean));
    const colors = new Set(items.map(i => i.color));
    const subCategories = new Set(items.map(i => i.subCategory));
    const totalItems = items.reduce((sum, i) => sum + (i.quantity || 1), 0);
    
    return {
      brands: brands.size,
      colors: colors.size,
      subCategories: subCategories.size,
      totalItems
    };
  }, [items]);

  // Data for Color Distribution
  const colorData = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      counts[item.color] = (counts[item.color] || 0) + (item.quantity || 1);
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ 
        name, 
        value,
        fill: getColorValue(name)
      }))
      .sort((a, b) => b.value - a.value);
  }, [items]);

  return (
    <div className="space-y-12 pb-24">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-serif font-medium text-stone-900">Wardrobe Analytics</h1>
        <p className="text-stone-500">Visualizing your collection by brand and color.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
          <p className="text-xs text-stone-500 uppercase tracking-wider font-medium mb-1">Total Brands</p>
          <p className="text-3xl font-bold text-stone-900">{stats.brands}</p>
        </div>
        <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
          <p className="text-xs text-stone-500 uppercase tracking-wider font-medium mb-1">Unique Colors</p>
          <p className="text-3xl font-bold text-stone-900">{stats.colors}</p>
        </div>
        <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
          <p className="text-xs text-stone-500 uppercase tracking-wider font-medium mb-1">Sub Categories</p>
          <p className="text-3xl font-bold text-stone-900">{stats.subCategories}</p>
        </div>
        <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
          <p className="text-xs text-stone-500 uppercase tracking-wider font-medium mb-1">Total Items</p>
          <p className="text-3xl font-bold text-stone-900">{stats.totalItems}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Brands Chart */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif italic text-stone-800">
              {showBottomBrands ? 'Bottom Brands' : 'Top Brands'}
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowBottomBrands(!showBottomBrands)}
              className="text-stone-500 hover:text-stone-900 gap-2"
            >
              {showBottomBrands ? (
                <>
                  <ArrowUpWideNarrow className="h-4 w-4" />
                  <span>Show Top</span>
                </>
              ) : (
                <>
                  <ArrowDownWideNarrow className="h-4 w-4" />
                  <span>Show Bottom</span>
                </>
              )}
            </Button>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={brandData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f5f5f4" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100} 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#78716c', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f5f5f4' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid #e7e5e4',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#1c1917" 
                  radius={[0, 4, 4, 0]} 
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Color Distribution Chart */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
          <h2 className="text-xl font-serif italic text-stone-800">Color Palette</h2>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={colorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {colorData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.fill === 'transparent' ? '#e7e5e4' : entry.fill} 
                      stroke="#e7e5e4"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid #e7e5e4',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
