import { SecurityUtils } from './crypto/security-utils.js';
import { FileDownloader } from './utils/file-downloader.js';
import { callApi } from './utils/common';

function viewTransferDetails(id: string) {
  // TODO:
  console.log(`Viewing details for transfer with ID: ${id}`);
}

function acceptTransfer(id: string) {
  callApi('POST', `/transfer/accept/${id}`)
    .then(() => {
      console.log(`Accepted transfer with ID: ${id}`);
      location.reload();
    })
    .catch((err) => {
      console.error(`Error accepting transfer with ID: ${id}`, err);
      alert('Failed to accept transfer.');
    });
}

function rejectTransfer(id: string) {
  callApi('POST', `/transfer/refuse/${id}`)
    .then(() => {
      console.log(`Rejected transfer with ID: ${id}`);
      location.reload();
    })
    .catch((err) => {
      console.error(`Error refusing transfer with ID: ${id}`, err);
      alert('Failed to refuse transfer.');
    });
}

async function downloadTransfer(id: string) {
  const userPrivateKey = await SecurityUtils.useUserPrivateKey();
  const downloader = FileDownloader.createDownloader(userPrivateKey);
  await downloader.downloadFile(id);
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
      void downloadTransfer(id);
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
