import React, { useState } from 'react';
import { InventoryView } from '../views/InventoryView';
import { UseCaseView } from '../views/UseCaseView';
import { AllItemsView } from '../views/AllItemsView';
import { AnalyticsView } from '../views/AnalyticsView';
import { LayoutGrid, Briefcase, List, BarChart2, LogOut, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWardrobe } from '../context/WardrobeContext';
import { Button } from './ui/button';

export function Layout() {
  const [currentView, setCurrentView] = useState<'inventory' | 'use-case' | 'all-items' | 'analytics'>('inventory');
  const { user, logout } = useWardrobe();

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-stone-200">
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-stone-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-serif font-bold">W</span>
            </div>
            <span className="font-serif font-medium text-lg hidden sm:inline">Mindful Wardrobe</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 rounded-full border border-stone-100">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="h-6 w-6 rounded-full" />
              ) : (
                <UserIcon className="h-4 w-4 text-stone-400" />
              )}
              <span className="text-sm font-medium text-stone-700 hidden md:inline">{user?.displayName}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} className="text-stone-400 hover:text-red-500">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-24 pb-32 md:py-32">
        {currentView === 'inventory' && <InventoryView />}
        {currentView === 'use-case' && <UseCaseView />}
        {currentView === 'all-items' && <AllItemsView />}
        {currentView === 'analytics' && <AnalyticsView />}
      </main>

      {/* Bottom Navigation for Mobile / Floating Dock for Desktop */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className="flex items-center gap-1 p-1.5 bg-stone-900/90 backdrop-blur-md text-stone-100 rounded-full shadow-lg border border-stone-800">
          <button
            onClick={() => setCurrentView('inventory')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
              currentView === 'inventory' ? "bg-stone-700 text-white" : "text-stone-400 hover:text-white"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Inventory</span>
          </button>
          <div className="w-px h-4 bg-stone-700 mx-1" />
          <button
            onClick={() => setCurrentView('use-case')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
              currentView === 'use-case' ? "bg-stone-700 text-white" : "text-stone-400 hover:text-white"
            )}
          >
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Use Case</span>
          </button>
          <div className="w-px h-4 bg-stone-700 mx-1" />
          <button
            onClick={() => setCurrentView('all-items')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
              currentView === 'all-items' ? "bg-stone-700 text-white" : "text-stone-400 hover:text-white"
            )}
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">All Items</span>
          </button>
          <div className="w-px h-4 bg-stone-700 mx-1" />
          <button
            onClick={() => setCurrentView('analytics')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
              currentView === 'analytics' ? "bg-stone-700 text-white" : "text-stone-400 hover:text-white"
            )}
          >
            <BarChart2 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
}
