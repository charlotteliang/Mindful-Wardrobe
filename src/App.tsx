import { StrictMode } from 'react';
import { WardrobeProvider, useWardrobe } from './context/WardrobeContext';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Button } from './components/ui/button';
import { LogIn } from 'lucide-react';

function AppContent() {
  const { user, loading, login } = useWardrobe();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-stone-200" />
          <div className="h-4 w-32 bg-stone-200 rounded" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-stone-200 text-center">
          <div className="h-16 w-16 bg-stone-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Database className="text-white h-8 w-8" />
          </div>
          <h1 className="text-3xl font-serif font-medium text-stone-900 mb-2">Mindful Wardrobe</h1>
          <p className="text-stone-500 mb-8">Sign in to manage your digital wardrobe and sync across devices.</p>
          <Button onClick={login} className="w-full py-6 text-lg gap-2">
            <LogIn className="h-5 w-5" /> Sign in with Google
          </Button>
        </div>
      </div>
    );
  }

  return <Layout />;
}

import { Database } from 'lucide-react';

export default function App() {
  return (
    <ErrorBoundary>
      <WardrobeProvider>
        <AppContent />
      </WardrobeProvider>
    </ErrorBoundary>
  );
}
