import { test, expect } from '../../fixtures/test-fixtures';
import { CATEGORY_UNDER_TEST, SEARCH } from '../../data/test-data';
import type { ProductListBody } from '../../utils/api-helper';

test.describe('Product search and filter', () => {
  /*
   * Priority: P2 | Type: Positive
   * Preconditions: Product catalog and category filters are available.
   * Steps:
   * 1. Open the products page.
   * 2. Select a category filter (Hammer).
   * 3. Inspect the returned product cards.
   * Expected Result: Every displayed result belongs to the selected category.
   */
  test('TC-07 [P2][Positive] Filter products by category @P2 @positive @automated', async ({ productsPage, api }) => {
    await productsPage.goto();

    const checkbox = productsPage.categoryCheckbox(CATEGORY_UNDER_TEST);
    // The checkbox carries the category id (data-test="category-<id>"), which we reuse for the API check
    const categoryId = (await checkbox.getAttribute('data-test'))?.replace('category-', '');
    expect(categoryId, 'category checkbox should expose its id').toBeTruthy();

    await checkbox.check();

    // The API is the source of truth for which products belong to this category
    const response = await api.getProductsByCategory(categoryId as string);
    expect(response.status()).toBe(200);
    const expected = ((await response.json()) as ProductListBody).data.map((product) => product.name);
    expect(expected.length).toBeGreaterThan(0);

    // expect.poll retries until the UI has finished re-filtering
    await expect.poll(() => productsPage.productNames.allInnerTexts()).toEqual(expected);

    // A product from another category must not leak into the filtered list
    await expect(productsPage.productCards.getByText('Combination Pliers')).toHaveCount(0);
  });

  /*
   * Priority: P2 | Type: Negative
   * Preconditions: A guaranteed non-existent query can be generated.
   * Steps:
   * 1. Enter the non-existent product name.
   * 2. Submit the search.
   * 3. Inspect the feedback and remaining cards.
   * Expected Result: A clear no-results message is displayed and stale cards are absent.
   */
  test('TC-08 [P2][Negative] Search for a non-existent product @P2 @negative @automated', async ({ productsPage }) => {
    const query = SEARCH.uniqueMissing();

    await productsPage.goto();
    await productsPage.searchFor(query);

    // The page names what was searched, and says plainly that nothing matched
    await expect(productsPage.noResults).toHaveText(SEARCH.noResultsMessage);
    // Cards from the unfiltered catalog must be gone, not left behind
    await expect(productsPage.productCards).toHaveCount(0);
  });

  /*
   * Priority: P3 | Type: Edge
   * Preconditions: Product catalog is available.
   * Steps:
   * 1. Search with special characters.
   * 2. Search with a string at the maximum length (40 characters).
   * 3. Search with a string one character over the maximum (41 characters).
   * Expected Result: Special characters and the maximum length fail safely with "no results";
   *                  the over-length string is rejected by the search box without a search.
   * Observed on the live app: 40 characters are searched, 41 make the field invalid and no search runs.
   */
  test('TC-09 [P3][Edge] Search with special characters or a very long string @P3 @edge @automated', async ({
    page,
    productsPage,
  }) => {
    // Any unhandled script error during these searches counts as a crash
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => pageErrors.push(error));

    await productsPage.goto();

    await test.step('Special characters are handled safely', async () => {
      await productsPage.searchFor(SEARCH.specialCharacters);
      await expect(productsPage.noResults).toHaveText(SEARCH.noResultsMessage);
    });

    await test.step('A query at the maximum length is accepted', async () => {
      await productsPage.searchFor('a'.repeat(SEARCH.maxLength));
      await expect(productsPage.noResults).toHaveText(SEARCH.noResultsMessage);
    });

    await test.step('A query one character over the limit is rejected', async () => {
      // Reload so the catalog is showing; any change after this point would mean a search ran
      await productsPage.goto();
      const searchRequests: string[] = [];
      page.on('request', (request) => {
        if (request.url().includes('/products/search')) searchRequests.push(request.url());
      });

      await productsPage.search.fill('a'.repeat(SEARCH.maxLength + 1));
      // Angular marks the control invalid as soon as the value is too long
      await expect(productsPage.search).toHaveClass(/ng-invalid/);
      await productsPage.searchSubmit.click();

      await expect(productsPage.searchCaption).toHaveCount(0);
      await expect(productsPage.noResults).toHaveCount(0);
      await expect(productsPage.productCards.first()).toBeVisible();
      expect(searchRequests, 'no search request should be sent for an invalid query').toHaveLength(0);
    });

    expect(pageErrors, 'searching must not raise unhandled script errors').toHaveLength(0);
  });
});
