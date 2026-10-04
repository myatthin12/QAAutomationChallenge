import { APIRequestContext, APIResponse } from '@playwright/test';

export interface ProductDto {
  id: number;
  title: string;
  price: number;
  cat: string;
  desc: string;
  img: string;
}

/**
 * Thin client over the DemoBlaze REST API.
 *
 * Every method returns the raw APIResponse so specs can assert on status
 * codes as well as bodies - the API has several cases where the status and
 * the body disagree, and hiding that would hide real defects.
 */
export class DemoBlazeApi {
  constructor(readonly request: APIRequestContext) {}

  /** DemoBlaze expects the password base64-encoded. */
  static encodePassword(password: string): string {
    return Buffer.from(password, 'utf-8').toString('base64');
  }

  login(username: string, password: string): Promise<APIResponse> {
    return this.request.post('/login', {
      data: { username, password: DemoBlazeApi.encodePassword(password) },
    });
  }

  /** Posts a raw login body, for malformed-input cases. */
  loginRaw(data: unknown): Promise<APIResponse> {
    return this.request.post('/login', { data });
  }

  signup(username: string, password: string): Promise<APIResponse> {
    return this.request.post('/signup', {
      data: { username, password: DemoBlazeApi.encodePassword(password) },
    });
  }

  entries(): Promise<APIResponse> {
    return this.request.get('/entries');
  }

  byCategory(cat: string): Promise<APIResponse> {
    return this.request.post('/bycat', { data: { cat } });
  }

  viewProduct(id: number | string): Promise<APIResponse> {
    return this.request.post('/view', { data: { id } });
  }

  /**
   * Logs in and returns the raw auth token.
   *
   * Used to establish a session without driving the login UI - see the
   * `signedIn` fixture.
   */
  async loginToken(username: string, password: string): Promise<string> {
    const response = await this.login(username, password);
    const body = await response.json();

    if (typeof body !== 'string' || !body.startsWith('Auth_token: ')) {
      throw new Error(`API login failed for ${username}: ${JSON.stringify(body)}`);
    }

    return body.replace('Auth_token: ', '');
  }

  async allProducts(): Promise<ProductDto[]> {
    const response = await this.entries();
    const body = await response.json();
    return body.Items as ProductDto[];
  }
}
