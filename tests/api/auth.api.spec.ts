import { test, expect } from '../../fixtures/test-fixtures';
import { DemoBlazeApi } from '../../api/DemoBlazeApi';
import { CREDENTIALS, INVALID_PASSWORD } from '../../config/env';

/**
 * API-level authentication checks against api.demoblaze.com.
 *
 * Running these below the UI gives fast feedback on contract changes and
 * catches cases the UI hides behind client-side validation.
 */
test.describe('Auth API', { tag: ['@api', '@regression'] }, () => {
  test(
    'API-001: returns an auth token for valid credentials',
    { tag: '@smoke' },
    async ({ api }) => {
      const response = await api.login(CREDENTIALS.username, CREDENTIALS.password);

      expect(response.status()).toBe(200);
      expect(await response.json()).toMatch(/^Auth_token: /);
    },
  );

  test('API-002: rejects a wrong password', async ({ api }) => {
    const response = await api.login(CREDENTIALS.username, INVALID_PASSWORD);

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ errorMessage: 'Wrong password.' });
  });

  test('API-003: rejects an unknown user', async ({ api }) => {
    const response = await api.login(`ghost-${Date.now()}`, INVALID_PASSWORD);

    expect(await response.json()).toEqual({ errorMessage: 'User does not exist.' });
  });

  test('API-004: never echoes the submitted password', async ({ api }) => {
    const response = await api.login(CREDENTIALS.username, CREDENTIALS.password);

    const body = JSON.stringify(await response.json());
    expect(body).not.toContain(CREDENTIALS.password);
  });

  test('API-005: registers a new account that can then log in', async ({ api }) => {
    const username = `qa-auto-api-${Date.now()}`;
    const password = 'Passw0rd!2026';

    const signup = await api.signup(username, password);
    expect(signup.status()).toBe(200);

    const login = await api.login(username, password);
    expect(await login.json()).toMatch(/^Auth_token: /);
  });

  test('API-006: refuses to register an existing username', async ({ api }) => {
    const response = await api.signup(CREDENTIALS.username, CREDENTIALS.password);

    expect(await response.json()).toEqual({ errorMessage: 'This user already exist.' });
  });

  test('API-007: treats the username as case-sensitive', async ({ api }) => {
    const response = await api.login(
      CREDENTIALS.username.toLowerCase(),
      CREDENTIALS.password,
    );

    expect(await response.json()).toEqual({ errorMessage: 'User does not exist.' });
  });

  test('API-008: does not trim whitespace around the username', async ({ api }) => {
    const response = await api.login(` ${CREDENTIALS.username} `, CREDENTIALS.password);

    expect(await response.json()).toEqual({ errorMessage: 'User does not exist.' });
  });

  test(
    'API-009: returns HTTP 500 for empty credentials',
    { tag: '@known-defect' },
    async ({ api }) => {
      const response = await api.loginRaw({ username: '', password: '' });

      // DEFECT-005: the endpoint crashes instead of answering 400 Bad Request.
      // The UI hides this behind client-side validation, so only an API-level
      // test can see it.
      expect(response.status()).toBe(500);
    },
  );

  test(
    'API-018: issues a predictable, forgeable auth token',
    { tag: '@known-defect' },
    async ({ api }) => {
      const first = await (
        await api.login(CREDENTIALS.username, CREDENTIALS.password)
      ).json();
      const second = await (
        await api.login(CREDENTIALS.username, CREDENTIALS.password)
      ).json();

      const decode = (token: string) =>
        Buffer.from(token.replace('Auth_token: ', ''), 'base64').toString('utf-8');

      const firstDecoded = decode(first as string);
      const secondDecoded = decode(second as string);

      // DEFECT-008: the session token is base64(username + a small global
      // counter) - not a signed or random value. It reveals the account name
      // and the counter is guessable, so a token for any known username can be
      // forged by trying nearby counter values.
      expect(firstDecoded).toContain(CREDENTIALS.username);
      const counterOf = (decoded: string) =>
        Number(decoded.slice(CREDENTIALS.username.length));
      expect(Number.isInteger(counterOf(firstDecoded))).toBe(true);
      expect(counterOf(secondDecoded)).toBeGreaterThanOrEqual(counterOf(firstDecoded));
    },
  );

  test(
    'API-019: accepts a single-character password at sign-up',
    { tag: '@known-defect' },
    async ({ api }) => {
      const username = `qa-auto-weak-${Date.now()}`;

      const signup = await api.signup(username, '1');
      expect(signup.status()).toBe(200);

      // DEFECT-011: no minimum length or complexity rule, and the account is
      // immediately usable with that password.
      const login = await api.login(username, '1');
      expect(await login.json()).toMatch(/^Auth_token: /);
    },
  );

  test(
    'API-020: returns HTTP 500 for an empty sign-up payload',
    { tag: '@known-defect' },
    async ({ api }) => {
      const response = await api.request.post('/signup', {
        data: { username: '', password: '' },
      });

      // DEFECT-005: same unvalidated-input crash as /login.
      expect(response.status()).toBe(500);
    },
  );

  test(
    'API-010: accepts a reversibly-encoded password',
    { tag: '@known-defect' },
    async ({ api }) => {
      const encoded = DemoBlazeApi.encodePassword(CREDENTIALS.password);

      // DEFECT-006: the password is base64 - encoding, not hashing - so it is
      // trivially recoverable from any captured request body.
      expect(Buffer.from(encoded, 'base64').toString('utf-8')).toBe(CREDENTIALS.password);

      const response = await api.login(CREDENTIALS.username, CREDENTIALS.password);
      expect(await response.json()).toMatch(/^Auth_token: /);
    },
  );
});
