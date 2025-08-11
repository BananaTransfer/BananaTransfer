declare global {
  interface Window {
    bootstrap: any;
  }
}

interface BootstrapModal {
  show: () => void;
  hide: () => void;
}

export function enforceLowerCase(input: HTMLInputElement) {
  // get current cursor position in the field
  // the property selectionStart isn't supported in some browser for fields with type email
  const pos = input.selectionStart;
  const lower = input.value.toLowerCase();
  if (input.value !== lower) {
    input.value = lower;
    if (pos !== null) {
      // restore the cursor position after modifying the value
      input.setSelectionRange(pos, pos);
    }
  }
}

export async function copyToClipboard(inputId: string, btnId: string) {
  const input = document.getElementById(inputId) as HTMLInputElement;
  const btn = document.getElementById(btnId) as HTMLButtonElement;
  if (!input.value) {
    // Optionally, you can give user feedback here (e.g., shake button, show tooltip)
    return;
  }
  await navigator.clipboard.writeText(input.value);
  btn.innerHTML = '<i class="bi bi-clipboard-check"></i>';
  setTimeout(() => {
    btn.innerHTML = '<i class="bi bi-clipboard"></i>';
  }, 1500);
}

export function showModal(
  modalId: string,
  inputId: string,
  confirmBtnId: string,
  errorId?: string,
  errorMessage: string = '',
): Promise<string | null> {
  return new Promise((resolve) => {
    const modalEl = document.getElementById(modalId)!;
    const inputEl = document.getElementById(inputId) as HTMLInputElement;
    const confirmBtn = document.getElementById(confirmBtnId)!;
    const errorDiv = errorId ? document.getElementById(errorId)! : null;
    const modal = new (
      window.bootstrap as { Modal: new (el: HTMLElement) => BootstrapModal }
    ).Modal(modalEl);

    inputEl.value = '';
    if (errorDiv) errorDiv.textContent = errorMessage;

    function cleanup() {
      confirmBtn.removeEventListener('click', onConfirm);
      modalEl.removeEventListener('hidden.bs.modal', onCancel);
    }

    function onConfirm() {
      if (!inputEl.value) {
        if (errorDiv) {
          errorDiv.textContent = 'This field is required';
        }
        inputEl.focus();
        return;
      }
      cleanup();
      modal.hide();
      resolve(inputEl.value);
    }

    function onCancel() {
      cleanup();
      resolve(null);
    }

    confirmBtn.addEventListener('click', onConfirm);
    modalEl.addEventListener('hidden.bs.modal', onCancel);
    modal.show();
    inputEl.focus();
  });
}
