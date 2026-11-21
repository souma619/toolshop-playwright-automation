# Toolshop Test Cases

| ID | Title | Priority | Type | Feature | Preconditions | Steps | Expected Result | Automated Y/N |
|---|---|---|---|---|---|---|---|---|
| TC-01 | Register a new user with valid data | P1 | Positive | Auth | Registration endpoint/page is available; email is unique | Open registration page; complete valid user details; submit | User is registered and success or login state is shown | Y |
| TC-02 | Register with an already-registered email | P2 | Negative | Auth | A registered demo account exists | Open registration page; enter existing email and valid remaining details; submit | Duplicate-email validation prevents registration | Y |
| TC-03 | Register with maximum-length first and last name | P3 | Edge | Auth | API limits names to 40/20 characters | Enter maximum-length first/last names and submit valid remaining fields | Boundary names are accepted or clearly rejected by boundary validation | Y |
| TC-04 | Logout after login and verify the session ends | P2 | Positive | Auth | Valid demo account exists | Login; open account menu; logout; access a protected route | Session ends and protected content is inaccessible | Y |
| TC-05 | Login and complete the E2E shopping flow | P1 | Positive | Auth / Cart / Checkout | Valid demo credentials exist in `.env`; cart is available | Login; search Pliers; open and add a product; proceed to checkout; confirm checkout | Login succeeds, order confirmation is displayed | Y |
| TC-06 | Login with invalid password | P1 | Negative | Auth | Demo email is valid; password is invalid | Open login; enter valid email and invalid password; submit | Login fails and `Invalid email or password` is shown | Y |
| TC-07 | Filter products by category | P2 | Positive | Search & Filter | Catalog and category filters are available | Open products; select category; inspect results | Only matching category products are shown | Y |
| TC-08 | Search for a non-existent product | P2 | Negative | Search & Filter | A guaranteed unique missing query is available | Enter missing product name; submit search | Clear no-results message is shown | Y |
| TC-09 | Search with special characters or a very long string | P3 | Edge | Search & Filter | Catalog is available | Search once with special characters, once with a very long string | App handles input without crashes or unhandled errors | Y |
| TC-10 | Update item quantity and recalculate total | P2 | Positive | Cart | A valid item is in the cart | Open cart; increase quantity; inspect totals | Quantity and totals recalculate correctly | Y |
| TC-11 | Reject zero or negative cart quantity | P2 | Negative | Cart | A valid item is in the cart | Set quantity to zero, then negative | Invalid quantity is rejected or item is removed consistently | Y |
| TC-12 | Set a very large cart quantity | P3 | Edge | Cart | A valid item is in the cart | Enter an extreme quantity | App handles it safely or rejects it clearly | Y |
| TC-13 | Checkout with a valid credit card | P1 | Positive | Checkout & Payment | Cart contains an item; valid card details are available | Complete billing/payment using a valid card | Payment and order complete successfully | Y |
| TC-14 | Checkout with an invalid card number | P1 | Negative | Checkout & Payment | Cart contains an item | Enter invalid card number and confirm payment | Card payment is rejected with validation | Y |
| TC-15 | Checkout using cash on delivery | P1 | Positive | Checkout & Payment | Cart contains an item; cash payment is offered | Select cash on delivery and confirm | Order is confirmed without card details | Y |
| TC-16 | Attempt checkout with an empty cart | P2 | Negative | Checkout & Payment | Cart is empty | Navigate to checkout or activate checkout action | Checkout is blocked and user is prompted to add items | Y |
| TC-17 | Checkout near card expiry boundary | P3 | Edge | Checkout & Payment | Cart contains an item; current date is known | Enter current-month and previous-month expiry values | Supported current month is accepted; expired month is rejected | Y |
| TC-18 | Call API with invalid product or login input | P2 | Negative | API | API is available | Call nonexistent product or invalid login API input | 4xx status and structured JSON error body are returned | Y |

## Totals

- 18 unique, sequential cases
- 7 positive, 7 negative, 4 edge
- 6 P1, 8 P2, 4 P3
- 18 automated (all cases). TC-05 and TC-06 are tagged `@video` and are the two recorded on the live-coding video
