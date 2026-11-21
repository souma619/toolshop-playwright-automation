// Central test data: no magic strings in the specs.

export const VALID_PASSWORD = 'Str0ng!Passw0rd#2026';

// Unique email per call so tests never collide with each other or with earlier runs
export const uniqueEmail = (prefix = 'qa.user'): string =>
  `${prefix}.${Date.now()}.${Math.floor(Math.random() * 100000)}@example.com`;

// ---------- Guest checkout ----------
export interface GuestUser {
  email: string;
  firstName: string;
  lastName: string;
}

export const guestUser = (): GuestUser => ({
  email: uniqueEmail('qa.guest'),
  firstName: 'Guest',
  lastName: 'Tester',
});

// ---------- Billing address ----------
export interface BillingAddress {
  country: string;
  postalCode: string;
  houseNumber: string;
  street: string;
  city: string;
  state: string;
}

export const BILLING_ADDRESS: BillingAddress = {
  country: 'India',
  postalCode: '560001',
  houseNumber: '12',
  street: 'MG Road',
  city: 'Bengaluru',
  state: 'Karnataka',
};

// ---------- Payment ----------
export const BANK_DETAILS = {
  bankName: 'Test Bank',
  accountName: 'Test Tester',
  accountNumber: '12345678',
};

export const CARD = {
  validNumber: '1111-1111-1111-1111',
  invalidNumber: '1234', // far too short, fails the card-number format check
  cvv: '123',
  holderName: 'Test Tester',
};

export const PAYMENT_METHOD = {
  creditCard: /credit card/i,
  cashOnDelivery: /cash on delivery/i,
  bankTransfer: /bank transfer/i,
  buyNowPayLater: /buy now pay later/i,
  giftCard: /gift card/i,
} as const;

export const GIFT_CARD = {
  number: 'GIFT1234ABCD5678', // exactly 16 letters/digits
  validationCode: '1234', // exactly 4 characters
};

export const BUY_NOW_PAY_LATER = {
  installments: '6', // "6 Monthly Installments"
};

// Card expiry is typed as MM/YYYY. Offset is in months from the current month
// (0 = this month, -1 = last month, 12 = same month next year).
export const formatExpiry = (monthOffset: number): string => {
  const date = new Date();
  date.setDate(1); // avoid day-of-month overflow when shifting months
  date.setMonth(date.getMonth() + monthOffset);
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

// ---------- Search ----------
export const SEARCH = {
  // The app's search box accepts at most 40 characters (observed: 40 is searched, 41 is rejected)
  maxLength: 40,
  specialCharacters: `!@#$%^&*()<>'";`,
  uniqueMissing: (): string => `zz-no-such-product-${Date.now()}`,
  noResultsMessage: 'There are no products found.',
};

// ---------- Cart ----------
export const CART = {
  maxQuantity: 99, // observed: larger values are capped to 99
  maxQuantityMessage: 'You can order at most 99 of this product.',
  emptyMessage: 'The cart is empty. Nothing to display.',
};

// ---------- API ----------
export const INVALID_LOGIN = {
  email: 'nobody.does.not.exist@example.com',
  password: 'Definitely-Wrong-Password-123!',
};

// Well-formed ID that does not belong to any product
export const NON_EXISTENT_PRODUCT_ID = '01JZZZZZZZZZZZZZZZZZZZZZZZ';

export const CATEGORY_UNDER_TEST = 'Hammer';

// ---------- E2E ----------
export const E2E = {
  sortCases: [
    { value: 'price,asc', label: 'Price (Low - High)' },
    { value: 'price,desc', label: 'Price (High - Low)' },
  ],
  maxPrice: 50,
  searchTerm: 'Pliers',
  brand: 'ForgeFlex Tools',
  category: 'Pliers',
  itemsInCart: 3,
  itemsInFavourites: 3,
  updatedQuantity: 3,
};
