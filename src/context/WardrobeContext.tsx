import React, { createContext, useContext, useEffect, useState } from 'react';
import { WardrobeItem, UseCase } from '../types';
import { 
  auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, User,
  collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, getDoc, writeBatch
} from '../firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  const err = new Error(JSON.stringify(errInfo));
  console.error(err);
  throw err;
}

interface WardrobeContextType {
  items: WardrobeItem[];
  user: User | null;
  loading: boolean;
  isImporting: boolean;
  customPalette: string[];
  addItem: (item: Omit<WardrobeItem, 'id' | 'createdAt'>) => Promise<void>;
  updateItem: (id: string, updatedItem: Partial<WardrobeItem>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  removeCategory: (category: string) => Promise<void>;
  deleteBrand: (brand: string) => Promise<void>;
  renameBrand: (oldBrand: string, newBrand: string) => Promise<void>;
  renameUseCase: (oldUseCase: string, newUseCase: UseCase) => Promise<void>;
  importItems: (newItems: WardrobeItem[], mode: 'merge' | 'replace') => Promise<void>;
  updateCustomPalette: (palette: string[]) => Promise<void>;
  cleanupPalette: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  categories: string[];
}

const WardrobeContext = createContext<WardrobeContextType | undefined>(undefined);

export function WardrobeProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [customPalette, setCustomPalette] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setItems([]);
        setCustomPalette([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    // Safety fallback: if snapshot doesn't fire in 8 seconds, stop pulse
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 8000);

    const itemsPath = `users/${user.uid}/items`;
    const q = query(collection(db, itemsPath));
    
    const unsubscribeItems = onSnapshot(q, (snapshot) => {
      clearTimeout(safetyTimeout);
      const newItems = snapshot.docs.map(doc => doc.data() as WardrobeItem);
      console.log(`Loaded ${newItems.length} items for user ${user.uid}`);
      setItems(newItems);
      setLoading(false);
    }, (error) => {
      clearTimeout(safetyTimeout);
      console.error("Firestore items snapshot error", error);
      handleFirestoreError(error, OperationType.LIST, itemsPath);
      setLoading(false);
    });

    const prefsPath = `users/${user.uid}/preferences/main`;
    const unsubscribePrefs = onSnapshot(doc(db, prefsPath), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCustomPalette(data.customPalette || []);
      } else {
        // Initialize preferences if they don't exist
        setDoc(doc(db, prefsPath), { customPalette: [] }, { merge: true })
          .catch(err => console.error("Failed to init prefs", err));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, prefsPath);
    });

    return () => {
      unsubscribeItems();
      unsubscribePrefs();
    };
  }, [user]);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const sanitizeData = (data: any) => {
    const sanitized = { ...data };
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === undefined) {
        delete sanitized[key];
      }
    });
    return sanitized;
  };

  const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("Operation timed out. Please check your connection.")), timeoutMs)
      ),
    ]);
  };

  const addItem = async (newItem: Omit<WardrobeItem, 'id' | 'createdAt'>) => {
    if (!user) return;
    const id = typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    const item: WardrobeItem = {
      ...newItem,
      id,
      createdAt: Date.now(),
    };
    const path = `users/${user.uid}/items/${id}`;
    try {
      await withTimeout(setDoc(doc(db, path), sanitizeData({ ...item, userId: user.uid })));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const updateItem = async (id: string, updatedItem: Partial<WardrobeItem>) => {
    if (!user) return;
    const path = `users/${user.uid}/items/${id}`;
    try {
      await withTimeout(updateDoc(doc(db, path), sanitizeData(updatedItem)));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const removeItem = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/items/${id}`;
    try {
      await withTimeout(deleteDoc(doc(db, path)));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const removeCategory = async (category: string) => {
    if (!user) return;
    const itemsToDelete = items.filter(i => i.category === category);
    if (itemsToDelete.length === 0) return;

    const batch = writeBatch(db);
    itemsToDelete.forEach(item => {
      batch.delete(doc(db, `users/${user.uid}/items/${item.id}`));
    });
    try {
      await withTimeout(batch.commit());
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/items (batch)`);
    }
  };

  const deleteBrand = async (brand: string) => {
    if (!user) return;
    const itemsToUpdate = items.filter(i => i.brand === brand);
    if (itemsToUpdate.length === 0) return;

    const batch = writeBatch(db);
    itemsToUpdate.forEach(item => {
      batch.update(doc(db, `users/${user.uid}/items/${item.id}`), { brand: "" });
    });
    try {
      await withTimeout(batch.commit());
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/items (batch)`);
    }
  };

  const renameBrand = async (oldBrand: string, newBrand: string) => {
    if (!user) return;
    const itemsToUpdate = items.filter(i => i.brand === oldBrand);
    if (itemsToUpdate.length === 0) return;

    const batch = writeBatch(db);
    itemsToUpdate.forEach(item => {
      batch.update(doc(db, `users/${user.uid}/items/${item.id}`), { brand: newBrand });
    });
    try {
      await withTimeout(batch.commit());
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/items (batch)`);
    }
  };

  const renameUseCase = async (oldUseCase: string, newUseCase: UseCase) => {
    if (!user) return;
    const itemsToUpdate = items.filter(i => (i.useCases as any[]).includes(oldUseCase));
    if (itemsToUpdate.length === 0) return;

    const batch = writeBatch(db);
    itemsToUpdate.forEach(item => {
      const newUseCases = item.useCases.map(uc => (uc as any) === oldUseCase ? newUseCase : uc);
      batch.update(doc(db, `users/${user.uid}/items/${item.id}`), { useCases: newUseCases as UseCase[] });
    });
    try {
      await withTimeout(batch.commit());
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/items (batch)`);
    }
  };

  const importItems = async (newItems: WardrobeItem[], mode: 'merge' | 'replace') => {
    if (!user) return;
    
    setIsImporting(true);
    try {
      // 1. Sanitize and prepare new items
      const sanitizedNewItems = newItems.map(item => {
        const sanitized: any = {
          ...item,
          userId: user.uid,
          quantity: Number(item.quantity) || 1,
          createdAt: Number(item.createdAt) || Date.now(),
          id: item.id || (typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)),
          useCases: Array.isArray(item.useCases) ? item.useCases : ['Work'],
          pattern: item.pattern || 'Solid',
        };
        
        // Remove any undefined or potentially problematic fields
        Object.keys(sanitized).forEach(key => {
          if (sanitized[key] === undefined) delete sanitized[key];
        });
        
        return sanitized as WardrobeItem;
      });

      // 2. Handle Deletion for 'replace' mode
      if (mode === 'replace') {
        const existingItemIds = items.map(i => i.id);
        const deleteChunks = [];
        for (let i = 0; i < existingItemIds.length; i += 500) {
          deleteChunks.push(existingItemIds.slice(i, i + 500));
        }

        console.log(`Starting deletion of ${existingItemIds.length} items in ${deleteChunks.length} batches...`);
        let batchIndex = 1;
        for (const chunk of deleteChunks) {
          const batch = writeBatch(db);
          chunk.forEach(id => {
            batch.delete(doc(db, `users/${user.uid}/items/${id}`));
          });
          await withTimeout(batch.commit());
          console.log(`Deletion batch ${batchIndex++}/${deleteChunks.length} committed.`);
        }
      }

      // 3. Import new items in batches
      const importChunks = [];
      for (let i = 0; i < sanitizedNewItems.length; i += 500) {
        importChunks.push(sanitizedNewItems.slice(i, i + 500));
      }

      console.log(`Starting import of ${sanitizedNewItems.length} items in ${importChunks.length} batches...`);
      let importBatchIndex = 1;
      for (const chunk of importChunks) {
        const batch = writeBatch(db);
        chunk.forEach(item => {
          const path = `users/${user.uid}/items/${item.id}`;
          batch.set(doc(db, path), item);
        });
        await withTimeout(batch.commit());
        console.log(`Import batch ${importBatchIndex++}/${importChunks.length} committed.`);
      }
      console.log('Import operation completed successfully.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/items`);
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * Updates the user's custom color palette in Firestore.
   * This ensures that colors used in the past (even if the items are deleted)
   * are persisted and available across devices.
   */
  const updateCustomPalette = async (palette: string[]) => {
    if (!user) return;
    const path = `users/${user.uid}/preferences/main`;
    try {
      await withTimeout(setDoc(doc(db, path), { customPalette: palette }, { merge: true }));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const cleanupPalette = async () => {
    if (!user) return;
    const usedColors = new Set(items.map(i => i.color));
    const newPalette = customPalette.filter(c => usedColors.has(c));
    await updateCustomPalette(newPalette);
  };

  const categories = Array.from(new Set(items.map((i) => i.category))).sort();

  return (
    <WardrobeContext.Provider value={{ 
      items, 
      user,
      loading,
      isImporting,
      customPalette,
      addItem, 
      updateItem, 
      removeItem, 
      removeCategory, 
      deleteBrand,
      renameBrand,
      renameUseCase,
      importItems,
      updateCustomPalette,
      cleanupPalette,
      login,
      logout,
      categories 
    }}>
      {children}
    </WardrobeContext.Provider>
  );
}

export function useWardrobe() {
  const context = useContext(WardrobeContext);
  if (context === undefined) {
    throw new Error('useWardrobe must be used within a WardrobeProvider');
  }
  return context;
}
