/**
 * @jest-environment jsdom
 */

import { createInput, mockClipboard } from './test-helpers';
import { enforceLowerCase, copyToClipboard } from '../common';

describe('common.ts functions', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('enforceLowerCase', () => {
    test('should convert input value to lowercase and preserve cursor', () => {
      // given
      const input = createInput('username', 'TestUser');
      input.selectionStart = 4;

      // when
      enforceLowerCase(input);

      // then
      expect(input.value).toBe('testuser');
      expect(input.selectionStart).toBe(4);
    });
  });

  describe('copyToClipboard', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <input id="copyInput" value="test" />
        <button id="copyBtn"></button>
      `;

      mockClipboard();
    });

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
