import { expect } from '@playwright/test';
import { test } from '@test/config';
import { faker } from '@faker-js/faker';

test.beforeEach(async ({ registerPage }) => {
  await registerPage.goto();
});

test('registering with username and password works (twice same password and default email)', async ({
  page,
  registerPage,
  transferListPage,
}) => {
  await registerPage.register({
    username: faker.internet.username(),
    password: faker.internet.password({ length: 13 }),
  });
  await expect(page).toHaveURL(transferListPage.URL);
});

test('registering with username, email and password works (twice same password)', async ({
  page,
  registerPage,
  transferListPage,
}) => {
  await registerPage.register({
    username: faker.internet.username(),
    email: faker.internet.email(),
    password: faker.internet.password({ length: 13 }),
  });
  await expect(page).toHaveURL(transferListPage.URL);
});

// TODO enable once fixed
// test('registering with two different password dont work', async ({
//   page,
//   registerPage,
// }) => {
//   await registerPage.register({
//     username: faker.internet.username(),
//     password: faker.internet.password({ length: 13 }),
//     confirmPassword: faker.internet.password({ length: 13 }),
//   });
//   await expect(page).toHaveURL(registerPage.URL);
// });

test('user should be redirected to transfer list if logged in', async ({
  registerPage,
  page,
  transferListPage,
}) => {
  const credentials = {
    username: faker.internet.username(),
    password: faker.internet.password({ length: 13 }),
  };

  await registerPage.goto();
  await registerPage.register(credentials);
  await registerPage.goto();
  await expect(page).toHaveURL(transferListPage.URL);
});
