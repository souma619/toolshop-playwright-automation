import { test, expect } from '../../fixtures/test-fixtures';
import { INVALID_LOGIN, NON_EXISTENT_PRODUCT_ID } from '../../data/test-data';
import type { LoginErrorBody, NotFoundBody } from '../../utils/api-helper';

test.describe('API check', () => {
  /*
   * Priority: P2 | Type: Negative
   * Preconditions: API is reachable; no valid session is needed.
   * Steps:
   * 1. POST /users/login with invalid credentials.
   * 2. POST /users/login with an empty body.
   * 3. GET /products/{id} with an ID that does not exist.
   * 4. Inspect status code and response body for each.
   * Expected Result: A 4xx status is returned with a structured JSON error body.
   * Observed on the live API: 401 {error}, 401 {error}, 404 {message}.
   */
  test('TC-18 [P2][Negative] Call API with invalid product or login input @P2 @negative @automated', async ({ api }) => {
    await test.step('Login API rejects invalid credentials with 401', async () => {
      const response = await api.login(INVALID_LOGIN.email, INVALID_LOGIN.password);

      // 401 is the specific code for bad credentials (not a 5xx crash, not a 200)
      expect(response.status()).toBe(401);
      // A structured error must be JSON, not an HTML error page
      expect(response.headers()['content-type']).toContain('application/json');
      const body = (await response.json()) as LoginErrorBody;
      expect(body.error).toBe('Unauthorized');
    });

    await test.step('Login API rejects an empty body with 401', async () => {
      const response = await api.loginWithBody({});

      expect(response.status()).toBe(401);
      expect(response.headers()['content-type']).toContain('application/json');
      const body = (await response.json()) as LoginErrorBody;
      expect(body.error).toBe('Invalid login request');
    });

    await test.step('Non-existent product returns 404', async () => {
      const response = await api.getProduct(NON_EXISTENT_PRODUCT_ID);

      // The ID is well formed but unknown, so the API must say "not found"
      expect(response.status()).toBe(404);
      expect(response.headers()['content-type']).toContain('application/json');
      const body = (await response.json()) as NotFoundBody;
      expect(body.message).toBe('Requested item not found');
    });
  });
});
