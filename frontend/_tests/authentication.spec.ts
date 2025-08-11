/**
 * @jest-environment jsdom
 */

import { createInput } from './test-helpers';
import {
  validatePasswordsMatch,
  validatePasswordsDoNotMatch,
  setupUsernameCheck,
  setupEmailCheck,
  setupPasswordMatchCheck,
  setupPasswordDoNotMatchCheck,
} from '../authentication';

describe('authentication.ts functions', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
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
