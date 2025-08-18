// Helper to create input elements
export function createInput(id: string, value = ''): HTMLInputElement {
  const input = document.createElement('input');
  input.id = id;
  input.value = value;
  document.body.appendChild(input);
  return input;
}

// Helper to mock the clipboard API for testing
export function mockClipboard() {
  if (!navigator.clipboard) {
    // @ts-expect-error: Assigning to navigator.clipboard for test mocking
    navigator.clipboard = {};
  }
  const mock = jest.fn(async () => Promise.resolve());
  navigator.clipboard.writeText = mock;
  return mock;
}
