import { test, expect } from '../../fixtures/test-fixtures';
import { CART } from '../../data/test-data';

test.describe('Cart', () => {
  // Cart tests are about the cart, not about finding a product, so each starts by seeding one item
  test.beforeEach(async ({ productsPage, cartPage }) => {
    await productsPage.addFirstProductToCart();
    await cartPage.goto();
    await expect(cartPage.lineItems).toHaveCount(1);
  });

  /*
   * Priority: P2 | Type: Positive
   * Preconditions: An item has been added to the cart.
   * Steps:
   * 1. Open the cart.
   * 2. Increase the item quantity.
   * 3. Inspect the line and cart totals.
   * Expected Result: Quantity and totals are recalculated correctly.
   */
  test('TC-10 [P2][Positive] Update item quantity and recalculate total @P2 @positive @automated', async ({ cartPage }) => {
    const newQuantity = 3;
    const unitPrice = await cartPage.unitPriceValue();

    await cartPage.setQuantity(newQuantity);

    // Totals are recalculated asynchronously, so poll until they settle
    await expect.poll(() => cartPage.linePriceValue()).toBeCloseTo(unitPrice * newQuantity, 2);
    await expect.poll(() => cartPage.cartTotalValue()).toBeCloseTo(unitPrice * newQuantity, 2);
    await expect(cartPage.quantity).toHaveValue(String(newQuantity));
    await expect(cartPage.headerQuantity).toHaveText(String(newQuantity));
  });

  /*
   * Priority: P2 | Type: Negative
   * Preconditions: A valid item is present in the cart.
   * Steps:
   * 1. Set the quantity to zero.
   * 2. Set the quantity to a negative number.
   * Expected Result: Invalid quantities are rejected or the item is removed consistently.
   * Observed on the live app: both values are corrected to the minimum of 1 and the item stays.
   */
  test('TC-11 [P2][Negative] Reject zero or negative cart quantity @P2 @negative @automated', async ({ cartPage }) => {
    const unitPrice = await cartPage.unitPriceValue();

    // Start above the minimum so a correction back to 1 is visible as a real change
    await cartPage.setQuantity(2);
    await expect.poll(() => cartPage.linePriceValue()).toBeCloseTo(unitPrice * 2, 2);

    for (const invalidQuantity of [0, -5]) {
      await test.step(`Quantity ${invalidQuantity} is corrected to 1`, async () => {
        await cartPage.setQuantity(invalidQuantity);

        await expect(cartPage.quantity).toHaveValue('1');
        await expect.poll(() => cartPage.linePriceValue()).toBeCloseTo(unitPrice, 2);
        await expect.poll(() => cartPage.cartTotalValue()).toBeCloseTo(unitPrice, 2);
        // The item must still be there: an invalid quantity never silently empties the cart
        await expect(cartPage.lineItems).toHaveCount(1);

        // Move away from 1 again so the next invalid value is also a real change
        await cartPage.setQuantity(2);
        await expect.poll(() => cartPage.linePriceValue()).toBeCloseTo(unitPrice * 2, 2);
      });
    }
  });

  /*
   * Priority: P3 | Type: Edge
   * Preconditions: A valid item is present in the cart.
   * Steps:
   * 1. Enter a very large quantity (1000).
   * 2. Inspect quantity limits and totals.
   * Expected Result: The app handles the value safely or rejects it with clear validation.
   * Observed on the live app: the quantity is capped at 99 and a message explains the limit.
   */
  test('TC-12 [P3][Edge] Set a very large cart quantity @P3 @edge @automated', async ({ page, cartPage }) => {
    const unitPrice = await cartPage.unitPriceValue();

    await cartPage.setQuantity(1000);

    await expect(cartPage.quantity).toHaveValue(String(CART.maxQuantity));
    await expect(page.getByText(CART.maxQuantityMessage)).toBeVisible();
    // Totals must reflect the capped quantity, not the 1000 that was typed
    await expect.poll(() => cartPage.linePriceValue()).toBeCloseTo(unitPrice * CART.maxQuantity, 2);
    await expect.poll(() => cartPage.cartTotalValue()).toBeCloseTo(unitPrice * CART.maxQuantity, 2);
  });
});
