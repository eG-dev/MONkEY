import { Locator } from '@playwright/test';

import { expect } from '../fixtures';

export async function expectFeedbackAligned(feedback: Locator): Promise<void> {
  const layout = await feedback.evaluate(async (element) => {
    await document.fonts.ready;

    const icon = element.querySelector('.icon');
    const body = element.querySelector('.message-body') ?? element;
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    let text = walker.nextNode();

    while (text && !text.textContent?.trim()) {
      text = walker.nextNode();
    }

    if (!icon || !text) {
      throw new Error('Feedback must contain an icon and visible message text.');
    }

    const range = document.createRange();

    range.selectNodeContents(text);

    const firstLine = range.getClientRects()[0];
    const bounds = icon.getBoundingClientRect();

    if (!firstLine) {
      throw new Error('Feedback text has no visible first line.');
    }

    return {
      centerOffset: Math.abs(bounds.top + bounds.height / 2 - firstLine.top - firstLine.height / 2),
      gap: firstLine.left - bounds.right,
    };
  });

  expect(layout.centerOffset).toBeLessThanOrEqual(1);
  expect(layout.gap).toBeGreaterThanOrEqual(4);
}
