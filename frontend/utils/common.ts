declare global {
  interface Window {
    bootstrap: any;
  }
}

export interface BootstrapModal {
  show: () => void;
  hide: () => void;
}

export interface TransferDetailsResponse {
  transfer: {
    id: string;
    filename: string;
    subject: string;
    status: string;
    created_at: string;
    size: string;
  };
  logs: Array<{
    id: number;
    info: string;
    created_at: string;
  }>;
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

export async function copyToClipboard(
  input: HTMLInputElement,
  btn: HTMLButtonElement,
) {
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

export async function callApi<R, T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: R,
): Promise<T> {
  const token = (document.getElementById('_csrf') as HTMLInputElement | null)
    ?.value;

  const request = {
    method: method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (body) {
    request['body'] = JSON.stringify({ _csrf: token, ...body });
  }

  const response = await fetch(path, request);

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      location.reload();
    }
    throw new Error(response.statusText);
  }

  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
