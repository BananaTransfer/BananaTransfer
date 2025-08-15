function viewTransferDetails(id: string) {
  // TODO:
  console.log(`Viewing details for transfer with ID: ${id}`);
}

function acceptTransfer(id: string) {
  // TODO:
  // fetch(`/transfer/accept/${id}`, { method: 'POST' }).then(() =>
  // location.reload(),
  // );
  console.log(`Accepted transfer with ID: ${id}`);
}

function rejectTransfer(id: string) {
  // TODO:
  console.log(`Rejected transfer with ID: ${id}`);
}

function downloadTransfer(id: string) {
  // TODO: real implementation
  window.location.href = `/transfer/download/${id}`;

  console.log(`Downloaded transfer with ID: ${id}`);
}

function deleteTransfer(id: string) {
  // TODO:
  console.log(`Deleted transfer with ID: ${id}`);
}

export function setupListPage() {
  const viewDetails = document.querySelectorAll('.view-details');
  const acceptButtons = document.querySelectorAll('.accept-btn');
  const rejectButtons = document.querySelectorAll('.reject-btn');
  const downloadButtons = document.querySelectorAll('.download-btn');
  const deleteButtons = document.querySelectorAll('.delete-btn');

  viewDetails.forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-id');
      if (!id) return;
      viewTransferDetails(id);
    });
  });

  acceptButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-id');
      if (!id) return;
      acceptTransfer(id);
    });
  });

  rejectButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-id');
      if (!id) return;
      rejectTransfer(id);
    });
  });

  downloadButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-id');
      if (!id) return;
      downloadTransfer(id);
    });
  });

  deleteButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-id');
      if (!id) return;
      deleteTransfer(id);
    });
  });
}
