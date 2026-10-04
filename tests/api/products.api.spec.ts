import { test, expect } from '../../fixtures/test-fixtures';
import { CATEGORIES, PRODUCTS } from '../../data/products';

test.describe('Products API', { tag: ['@api', '@regression'] }, () => {
  test('API-011: lists the product catalogue', { tag: '@smoke' }, async ({ api }) => {
    const response = await api.entries();

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.Items)).toBe(true);
    expect(body.Items.length).toBeGreaterThan(0);
  });

  test('API-012: every catalogue entry has the required fields', async ({ api }) => {
    const products = await api.allProducts();

    for (const product of products) {
      expect(product.id, 'id').toBeTruthy();
      expect(product.title, `title for id ${product.id}`).toBeTruthy();
      expect(typeof product.price, `price type for ${product.title}`).toBe('number');
      expect(product.price, `price for ${product.title}`).toBeGreaterThan(0);
      expect(CATEGORIES, `category for ${product.title}`).toContain(product.cat);
    }
  });

  test('API-013: returns a single product by id', async ({ api }) => {
    const expected = PRODUCTS.galaxyS6;

    const response = await api.viewProduct(expected.id);

    const body = await response.json();
    expect(body.title).toBe(expected.title);
    expect(body.price).toBe(expected.price);
    expect(body.cat).toBe(expected.category);
  });

  test('API-014: the UI fixture prices match the catalogue', async ({ api }) => {
    const products = await api.allProducts();

    // Guards the UI suite: a catalogue price change fails here, loudly, rather
    // than showing up as a confusing cart-total mismatch.
    for (const expected of Object.values(PRODUCTS)) {
      const actual = products.find((product) => product.id === expected.id);
      expect(actual, `product id ${expected.id} missing from catalogue`).toBeDefined();
      expect(actual?.title).toBe(expected.title);
      expect(actual?.price).toBe(expected.price);
    }
  });

  test('API-015: filters products by category', async ({ api }) => {
    const response = await api.byCategory('phone');

    const body = await response.json();
    expect(body.Items.length).toBeGreaterThan(0);
    for (const product of body.Items) {
      expect(product.cat).toBe('phone');
    }
  });

  test('API-016: returns no items for an unknown category', async ({ api }) => {
    const response = await api.byCategory(`nope-${Date.now()}`);

    const body = await response.json();
    expect(body.Items).toEqual([]);
  });

  test(
    'API-017: answers HTTP 200 for a non-existent product id',
    { tag: '@known-defect' },
    async ({ api }) => {
      const response = await api.viewProduct(99999999);

      // DEFECT-007: a missing resource should be 404. The endpoint returns 200
      // with an error body, so any client checking only the status code treats
      // the failure as a success.
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual({ errorMessage: 'Not found.' });
    },
  );
});
