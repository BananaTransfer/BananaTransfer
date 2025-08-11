/**
 * @jest-environment jsdom
 */

import { copyToClipboard } from './common';

describe('common.ts functions', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="copyInput" value="test" />
      <button id="copyBtn"></button>
    `;

    // Mock clipboard if not present
    if (!navigator.clipboard) {
      // @ts-ignore
      navigator.clipboard = {};
    }
    navigator.clipboard.writeText = jest.fn();
  });

  describe('copyToClipboard', () => {
    test('copyToClipboard updates button', async () => {
      // given
      const input = document.getElementById('copyInput') as HTMLInputElement;
      const btn = document.getElementById('copyBtn') as HTMLButtonElement;
      input.value = 'test content';

      // when
      await copyToClipboard('copyInput', 'copyBtn');

      // then
      expect(btn.innerHTML).toContain('bi-clipboard-check');
    });

    test('copyToClipboard copies value', async () => {
      // given
      const input = document.getElementById('copyInput') as HTMLInputElement;
      input.value = 'test content';
      // Mock clipboard
      const writeTextMock = jest.fn();
      navigator.clipboard.writeText = writeTextMock;

      // when
      await copyToClipboard('copyInput', 'copyBtn');

      // then
      expect(writeTextMock).toHaveBeenCalledWith('test content');
    });
  });
});
