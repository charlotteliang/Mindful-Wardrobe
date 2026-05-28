export const PRESET_COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Gray', value: '#808080' },
  { name: 'Navy', value: '#000080' },
  { name: 'Beige', value: '#F5F5DC' },
  { name: 'Brown', value: '#8B4513' },
  { name: 'Red', value: '#DC2626' },
  { name: 'Pink', value: '#F472B6' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#FACC15' },
  { name: 'Green', value: '#16A34A' },
  { name: 'Blue', value: '#2563EB' },
  { name: 'Purple', value: '#9333EA' },
  { name: 'Charcoal', value: '#36454F' },
  { name: 'Olive', value: '#808000' },
  { name: 'Maroon', value: '#800000' },
  { name: 'Teal', value: '#008080' },
  { name: 'Silver', value: '#C0C0C0' },
  { name: 'Gold', value: '#FFD700' },
  { name: 'Khaki', value: '#F0E68C' },
  { name: 'Coral', value: '#FF7F50' },
  { name: 'Indigo', value: '#4B0082' },
  { name: 'Magenta', value: '#FF00FF' },
];

export const COLOR_MAP: Record<string, string> = PRESET_COLORS.reduce((acc, c) => {
  acc[c.name] = c.value;
  return acc;
}, {} as Record<string, string>);

export const CATEGORY_ORDER = ['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Dresses'];

export const getColorValue = (color: string) => {
  if (!color) return 'transparent';
  if (color.startsWith('#')) return color;
  const key = Object.keys(COLOR_MAP).find(k => k.toLowerCase() === color.toLowerCase());
  return key ? COLOR_MAP[key] : color;
};
