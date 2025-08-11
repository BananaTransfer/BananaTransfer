/**
 * @jest-environment jsdom
 */

import {
  enforceLowerCase,
  validatePasswordsMatch,
  validatePasswordsDoNotMatch,
  setupUsernameCheck,
  setupEmailCheck,
  setupPasswordMatchCheck,
  setupPasswordDoNotMatchCheck,
} from './authentication';

// Helper to create input elements
function createInput(id: string, value = ''): HTMLInputElement {
  const input = document.createElement('input');
  input.id = id;
  input.value = value;
  document.body.appendChild(input);
  return input;
}

describe('authentication.ts functions', () => {
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
      expect(input.value).toBe('testuser');

      // then
      expect(input.selectionStart).toBe(4);
    });
  });

  describe('validatePasswordsMatch', () => {
    test('should set custom validity if passwords do not match', () => {
      // given
      const password = createInput('password', 'abc');
      const confirm = createInput('confirmPassword', 'def');

      // when
      validatePasswordsMatch(password, confirm);

      // then
      expect(confirm.validationMessage).toBe('Passwords do not match');
    });
    test('should clear custom validity if passwords match', () => {
      // given
      const password = createInput('password', 'abc');
      const confirm = createInput('confirmPassword', 'abc');

      // when
      validatePasswordsMatch(password, confirm);

      // then
      expect(confirm.validationMessage).toBe('');
    });
  });

  describe('validatePasswordsDoNotMatch', () => {
    test('should set custom validity if passwords are the same', () => {
      // given
      const current = createInput('currentPassword', 'abc');
      const password = createInput('password', 'abc');

      // when
      validatePasswordsDoNotMatch(current, password);

      // then
      expect(password.validationMessage).toBe(
        'New password must be different from current password',
      );
    });
    test('should clear custom validity if passwords are different', () => {
      // given
      const current = createInput('currentPassword', 'abc');
      const password = createInput('password', 'def');

      // when
      validatePasswordsDoNotMatch(current, password);

      // then
      expect(password.validationMessage).toBe('');
    });
  });

  describe('setupUsernameCheck', () => {
    test('should enforce lowercase on username input', () => {
      // given
      const input = createInput('username', 'TestUser');
      setupUsernameCheck();

      // when
      input.value = 'AnotherUser';
      input.dispatchEvent(new Event('input'));

      // then
      expect(input.value).toBe('anotheruser');
    });
  });

  describe('setupEmailCheck', () => {
    test('should update email when username changes', () => {
      // given
      const username = createInput('username', 'user');
      const email = createInput('email', '');
      setupEmailCheck('example.com');

      // when
      username.value = 'newuser';
      username.dispatchEvent(new Event('input'));

      // then
      expect(email.value).toBe('newuser@example.com');
    });
  });

  describe('setupPasswordMatchCheck', () => {
    test('should validate password match on input', () => {
      // given
      const password = createInput('password', 'abc');
      const confirm = createInput('confirmPassword', 'def');
      setupPasswordMatchCheck();

      // when
      password.value = 'abc';
      confirm.value = 'abc';
      password.dispatchEvent(new Event('input'));
      confirm.dispatchEvent(new Event('input'));

      // then
      expect(confirm.validationMessage).toBe('');
    });
  });

  describe('setupPasswordDoNotMatchCheck', () => {
    test('should validate password is different from current', () => {
      // given
      const current = createInput('currentPassword', 'abc');
      const password = createInput('password', 'abc');
      setupPasswordDoNotMatchCheck();

      // when
      current.value = 'abc';
      password.value = 'abc';
      current.dispatchEvent(new Event('input'));
      password.dispatchEvent(new Event('input'));

      // then
      expect(password.validationMessage).toBe(
        'New password must be different from current password',
      );
    });
  });
});
