import { enforceLowerCase } from './common.js';

export function validatePasswordsMatch(
  passwordInput: HTMLInputElement,
  confirmPasswordInput: HTMLInputElement,
) {
  if (passwordInput.value !== confirmPasswordInput.value) {
    confirmPasswordInput.setCustomValidity('Passwords do not match');
  } else {
    confirmPasswordInput.setCustomValidity('');
  }
}

export function validatePasswordsDoNotMatch(
  currentPasswordInput: HTMLInputElement,
  passwordInput: HTMLInputElement,
) {
  if (passwordInput.value === currentPasswordInput.value) {
    passwordInput.setCustomValidity(
      'New password must be different from current password',
    );
  } else {
    passwordInput.setCustomValidity('');
  }
}

export function setupUsernameCheck() {
  const usernameInput = document.getElementById(
    'username',
  ) as HTMLInputElement | null;
  if (!usernameInput) return;

  usernameInput.addEventListener('input', function () {
    enforceLowerCase(usernameInput);
  });
}

export function setupEmailCheck(domain: string) {
  const usernameInput = document.getElementById(
    'username',
  ) as HTMLInputElement | null;
  const emailInput = document.getElementById(
    'email',
  ) as HTMLInputElement | null;
  if (!usernameInput || !emailInput) return;

  emailInput.addEventListener('input', function () {
    enforceLowerCase(emailInput);
  });

  // Track the previous username to compute the previous auto-generated email
  let previousUsername = usernameInput.value;

  usernameInput.addEventListener('input', function () {
    const prevAutoEmail = previousUsername
      ? previousUsername + '@' + domain
      : '';
    // Only update if the email matches the previous auto-generated value OR is empty
    if (emailInput.value === prevAutoEmail || emailInput.value === '') {
      emailInput.value = usernameInput.value
        ? usernameInput.value + '@' + domain
        : '';
    }
    previousUsername = usernameInput.value;
  });
}

export function setupPasswordMatchCheck() {
  const passwordInput = document.getElementById(
    'password',
  ) as HTMLInputElement | null;
  const confirmPasswordInput = document.getElementById(
    'confirmPassword',
  ) as HTMLInputElement | null;
  if (!passwordInput || !confirmPasswordInput) return;

  // Password match validation
  passwordInput.addEventListener('input', function () {
    validatePasswordsMatch(passwordInput, confirmPasswordInput);
  });
  confirmPasswordInput.addEventListener('input', function () {
    validatePasswordsMatch(passwordInput, confirmPasswordInput);
  });
}

export function setupPasswordDoNotMatchCheck() {
  const currentPasswordInput = document.getElementById(
    'currentPassword',
  ) as HTMLInputElement | null;
  const passwordInput = document.getElementById(
    'password',
  ) as HTMLInputElement | null;
  if (!currentPasswordInput || !passwordInput) return;

  // Password do not match validation
  currentPasswordInput.addEventListener('input', function () {
    validatePasswordsDoNotMatch(currentPasswordInput, passwordInput);
  });
  passwordInput.addEventListener('input', function () {
    validatePasswordsDoNotMatch(currentPasswordInput, passwordInput);
  });
}

export function setupLoginForm() {
  document.addEventListener('DOMContentLoaded', function () {
    setupUsernameCheck();
  });
}

export function setupRegisterForm(domain: string) {
  document.addEventListener('DOMContentLoaded', function () {
    setupUsernameCheck();
    setupEmailCheck(domain);
    setupPasswordMatchCheck();
  });
}

export function setupChangePasswordForm() {
  document.addEventListener('DOMContentLoaded', function () {
    setupPasswordMatchCheck();
    setupPasswordDoNotMatchCheck();
  });
}
