/**
 * Product fixtures. Ids and prices mirror the DemoBlaze catalogue and are
 * asserted by the API suite, so a catalogue change fails loudly here rather
 * than silently skewing the UI tests.
 */
export interface Product {
  id: number;
  title: string;
  price: number;
  category: 'phone' | 'notebook' | 'monitor';
}

export const PRODUCTS: Record<string, Product> = {
  galaxyS6: { id: 1, title: 'Samsung galaxy s6', price: 360, category: 'phone' },
  nokiaLumia1520: { id: 2, title: 'Nokia lumia 1520', price: 820, category: 'phone' },
  nexus6: { id: 3, title: 'Nexus 6', price: 650, category: 'phone' },
};

export const CATEGORIES = ['phone', 'notebook', 'monitor'] as const;
