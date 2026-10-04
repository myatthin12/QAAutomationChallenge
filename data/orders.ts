export interface OrderDetails {
  name: string;
  country: string;
  city: string;
  card: string;
  month: string;
  year: string;
}

export const VALID_ORDER: OrderDetails = {
  name: 'John Doe',
  country: 'Myanmar',
  city: 'Yangon',
  card: '4111111111111111',
  month: '12',
  year: '2027',
};

export const EMPTY_ORDER: OrderDetails = {
  name: '',
  country: '',
  city: '',
  card: '',
  month: '',
  year: '',
};

/** Builds a valid order with specific fields overridden or blanked out. */
export const orderWith = (overrides: Partial<OrderDetails>): OrderDetails => ({
  ...VALID_ORDER,
  ...overrides,
});

export const LONG_TEXT = 'A'.repeat(300);
export const XSS_PAYLOAD = '<script>window.__xssExecuted = true</script>';
