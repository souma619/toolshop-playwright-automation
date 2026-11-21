import { APIRequestContext, APIResponse } from '@playwright/test';

// The API lives on a different host than the UI, so every call uses an absolute URL.
// (The Playwright baseURL points at the UI, which would return HTML for these paths.)
export const API_URL = process.env.API_URL ?? 'https://api.practicesoftwaretesting.com';

const JSON_HEADERS = { Accept: 'application/json' };

// Shapes of the error bodies the API returns (observed against the live API)
export interface LoginErrorBody {
  error: string;
}
export interface NotFoundBody {
  message: string;
}
export interface ProductSummary {
  id: string;
  name: string;
}
export interface ProductListBody {
  data: ProductSummary[];
  total: number;
}

// Thin wrapper over the REST API. It only sends requests; assertions stay in the specs.
export class ApiHelper {
  constructor(private readonly request: APIRequestContext) {}

  async login(email: string, password: string): Promise<APIResponse> {
    return this.request.post(`${API_URL}/users/login`, {
      headers: JSON_HEADERS,
      data: { email, password },
    });
  }

  async loginWithBody(data: Record<string, unknown>): Promise<APIResponse> {
    return this.request.post(`${API_URL}/users/login`, { headers: JSON_HEADERS, data });
  }

  async getProduct(id: string): Promise<APIResponse> {
    return this.request.get(`${API_URL}/products/${id}`, { headers: JSON_HEADERS });
  }

  async searchProducts(query: string): Promise<APIResponse> {
    return this.request.get(`${API_URL}/products/search`, {
      headers: JSON_HEADERS,
      params: { q: query },
    });
  }

  // Generic product listing, e.g. { by_category, by_brand, between: 'price,1,50', page }
  async getProducts(params: Record<string, string | number>): Promise<APIResponse> {
    return this.request.get(`${API_URL}/products`, { headers: JSON_HEADERS, params });
  }

  async getProductsByCategory(categoryId: string): Promise<APIResponse> {
    return this.request.get(`${API_URL}/products`, {
      headers: JSON_HEADERS,
      params: { by_category: categoryId, page: 0 },
    });
  }
}
