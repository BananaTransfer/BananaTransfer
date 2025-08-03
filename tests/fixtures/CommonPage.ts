import { Page } from '@playwright/test';

export default abstract class CommonPage {
  protected readonly PAGE: Page;
  public readonly URL: string;

  protected constructor(page: Page, url: string) {
    this.PAGE = page;
    this.URL = url;
  }

  public async goto() {
    await this.PAGE.goto(this.URL);
  }
}