import { Locator, Page } from '@playwright/test';

export class ExamplePage {
  readonly learnMoreLink: Locator;

  constructor(private readonly page: Page) {
    this.learnMoreLink = page.getByRole('link', { name: 'Learn more' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }
}
