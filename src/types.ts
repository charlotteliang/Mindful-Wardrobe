export type UseCase = 'Work' | 'Fun' | 'Active' | 'Lounge Wear';
export type Pattern = 'Solid' | 'Stripes' | 'Florals' | 'Plaids' | 'Herringbone' | 'Polka Dots' | 'Checked' | 'Sparkles';

export interface WardrobeItem {
  id: string;
  category: string;
  subCategory: string;
  useCases: UseCase[];
  brand?: string;
  color: string;
  pattern: Pattern;
  quantity: number;
  tags?: string[];
  createdAt: number;
}

export interface CategorySummary {
  name: string;
  total: number;
  subCategories: Record<string, number>;
}
