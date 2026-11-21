import { Locator, Page, expect } from '@playwright/test';
import {
  BANK_DETAILS,
  BILLING_ADDRESS,
  BUY_NOW_PAY_LATER,
  GIFT_CARD,
  BillingAddress,
  CARD,
  GuestUser,
  PAYMENT_METHOD,
} from '../data/test-data';

export class CheckoutPage {
  // Guest step
  readonly guestTab: Locator;
  readonly guestEmail: Locator;
  readonly guestFirstName: Locator;
  readonly guestLastName: Locator;
  readonly guestSubmit: Locator;

  // Billing step
  readonly country: Locator;
  readonly postalCode: Locator;
  readonly houseNumber: Locator;
  readonly street: Locator;
  readonly city: Locator;
  readonly state: Locator;
  readonly proceedToPayment: Locator;

  // Payment step
  readonly paymentMethod: Locator;
  readonly cardNumber: Locator;
  readonly expiryDate: Locator;
  readonly cvv: Locator;
  readonly cardHolderName: Locator;
  readonly bankName: Locator;
  readonly accountName: Locator;
  readonly accountNumber: Locator;
  readonly confirmButton: Locator;
  readonly monthlyInstallments: Locator;
  readonly giftCardNumber: Locator;
  readonly giftCardValidationCode: Locator;
  readonly successMessage: Locator;
  readonly validationErrors: Locator;

  constructor(private readonly page: Page) {
    this.guestTab = page.getByRole('tab', { name: 'Continue as Guest' });
    this.guestEmail = page.getByTestId('guest-email');
    this.guestFirstName = page.getByTestId('guest-first-name');
    this.guestLastName = page.getByTestId('guest-last-name');
    this.guestSubmit = page.getByTestId('guest-submit');

    this.country = page.getByTestId('country');
    this.postalCode = page.getByTestId('postal_code');
    this.houseNumber = page.getByTestId('house_number');
    this.street = page.getByTestId('street');
    this.city = page.getByTestId('city');
    this.state = page.getByTestId('state');
    this.proceedToPayment = page.getByTestId('proceed-3');

    this.paymentMethod = page.getByTestId('payment-method');
    this.cardNumber = page.getByTestId('credit_card_number').or(page.getByLabel(/credit card number/i));
    this.expiryDate = page.getByTestId('expiration_date').or(page.getByLabel(/expiration date/i));
    this.cvv = page.getByTestId('cvv').or(page.getByLabel(/cvv/i));
    this.cardHolderName = page.getByTestId('card_holder_name').or(page.getByLabel(/card holder name/i));
    this.bankName = page.getByTestId('bank_name');
    this.accountName = page.getByTestId('account_name');
    this.accountNumber = page.getByTestId('account_number');
    this.monthlyInstallments = page.getByTestId('monthly_installments').or(page.getByLabel(/monthly installments/i));
    this.giftCardNumber = page.getByTestId('gift_card_number').or(page.getByLabel(/gift card number/i));
    this.giftCardValidationCode = page.getByTestId('validation_code').or(page.getByLabel(/validation code/i));
    this.confirmButton = page.getByTestId('finish');
    this.successMessage = page
      .getByTestId('payment-success-message')
      .or(page.getByText(/payment was successful|order confirmed|thank you/i));
    // Any visible form validation message on the payment step
    this.validationErrors = page.locator('.invalid-feedback, .alert-danger, [data-test$="-error"]');
  }

  // Picks an option from a <select> by its visible text (case-insensitive pattern)
  private async selectByText(select: Locator, text: string | RegExp): Promise<void> {
    const value = await select.locator('option').filter({ hasText: text }).first().getAttribute('value');
    if (value === null) {
      throw new Error(`No option matching ${String(text)} found`);
    }
    await select.selectOption(value);
  }

  // Sign-in step -> continue without an account
  async continueAsGuest(user: GuestUser): Promise<void> {
    // The sign-in step shows the login form first; the guest form sits behind its own tab
    await this.guestTab.click();
    await this.guestEmail.fill(user.email);
    await this.guestFirstName.fill(user.firstName);
    await this.guestLastName.fill(user.lastName);
    await this.guestSubmit.click();
    // Guest details are confirmed on a summary screen with its own button
    await this.page.getByRole('button', { name: 'Proceed to checkout' }).click();
  }

  // Billing step: fills every field (so prefilled profile data is overwritten) and moves to payment
  async fillBillingAddress(address: BillingAddress = BILLING_ADDRESS): Promise<void> {
    await this.selectByText(this.country, address.country);
    await this.postalCode.fill(address.postalCode);
    await this.houseNumber.fill(address.houseNumber);
    await this.street.fill(address.street);
    await this.city.fill(address.city);
    await this.state.fill(address.state);
    await this.proceedToPayment.click();
    await expect(this.paymentMethod).toBeVisible();
  }

  async selectPaymentMethod(method: RegExp): Promise<void> {
    await this.selectByText(this.paymentMethod, method);
  }

  async confirmBankTransfer(): Promise<void> {
    await this.selectPaymentMethod(PAYMENT_METHOD.bankTransfer);
    // Bank transfer asks for bank details; skip quietly if this app version does not
    const asksForBankDetails = await this.bankName
      .waitFor({ state: 'visible', timeout: 3_000 })
      .then(() => true, () => false);
    if (asksForBankDetails) {
      await this.bankName.fill(BANK_DETAILS.bankName);
      await this.accountName.fill(BANK_DETAILS.accountName);
      await this.accountNumber.fill(BANK_DETAILS.accountNumber);
    }
  }

  async fillCardDetails(details: { number: string; expiry: string; cvv?: string; holder?: string }): Promise<void> {
    await this.cardNumber.fill(details.number);
    await this.expiryDate.fill(details.expiry);
    await this.cvv.fill(details.cvv ?? CARD.cvv);
    await this.cardHolderName.fill(details.holder ?? CARD.holderName);
    // Leaving the last field marks every control as touched so validation messages show
    await this.cardHolderName.blur();
  }

  async expectConfirmation(): Promise<void> {
    await expect(this.successMessage.first()).toBeVisible();
  }

  async payWithBuyNowPayLater(installments: string = BUY_NOW_PAY_LATER.installments): Promise<void> {
    await this.selectPaymentMethod(PAYMENT_METHOD.buyNowPayLater);
    await this.selectByText(this.monthlyInstallments, new RegExp(`^\\s*${installments}\\b`));
  }

  async payWithGiftCard(): Promise<void> {
    await this.selectPaymentMethod(PAYMENT_METHOD.giftCard);
    await this.giftCardNumber.fill(GIFT_CARD.number);
    await this.giftCardValidationCode.fill(GIFT_CARD.validationCode);
  }

  // The confirmation message contains the invoice number (e.g. INV-2026000123)
  // The first confirm only validates the payment ("Payment was successful"); a second confirm places the order
  async placeOrder(): Promise<void> {
    await this.confirmButton.click();
    await this.expectConfirmation();
    // Confirm again until the invoice number appears (the button needs a moment to become active)
    const invoice = this.page.getByText(/INV-\d+/).first();
    await expect(async () => {
      if (!(await invoice.isVisible())) {
        await this.confirmButton.click();
      }
      await expect(invoice).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: 20_000 });
  }

  async readInvoiceNumber(): Promise<string> {
    const text = await this.page.getByText(/INV-\d+/).first().innerText();
    const match = text.match(/INV-\d+/);
    if (!match) {
      throw new Error(`No invoice number found in "${text}"`);
    }
    return match[0];
  }
}
