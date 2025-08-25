import { SecurityUtils } from './crypto/security-utils.js';
import { FileDownloader } from './utils/file-downloader.js';
import { callApi, BootstrapModal, formatFileSize } from './utils/common.js';

async function viewTransferDetails(id: string) {
  try {
    const transfer = (await callApi<void, unknown>(
      'GET',
      `/transfer/${id}`,
    )) as {
      filename: string;
      status: string;
      subject: string;
      created_at: string;
      size?: string;
      logs: Array<{
        id: number;
        info: string;
        created_at: string;
        user: string;
      }>;
    };

    document.getElementById('modalFilename')!.textContent =
      transfer.filename || 'N/A';
    document.getElementById('modalStatus')!.textContent =
      transfer.status || 'N/A';
    document.getElementById('modalSubject')!.textContent =
      transfer.subject || 'N/A';
    document.getElementById('modalCreatedAt')!.textContent =
      transfer.created_at || 'N/A';
    document.getElementById('modalSize')!.textContent = transfer.size
      ? formatFileSize(Number(transfer.size))
      : 'N/A';

    const logsTableBody = document.getElementById('modalLogs')!;
    logsTableBody.innerHTML = '';

    if (transfer.logs && transfer.logs.length > 0) {
      transfer.logs.forEach((log) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${formatLogInfo(log.info)}</td>
          <td>${new Date(log.created_at).toLocaleString()}</td>
          <td>${log.user}</td>
        `;
        logsTableBody.appendChild(row);
      });
    } else {
      const row = document.createElement('tr');
      row.innerHTML =
        '<td colspan="2" class="text-center">No logs available</td>';
      logsTableBody.appendChild(row);
    }

    const modal = new (
      window.bootstrap as { Modal: new (el: HTMLElement) => BootstrapModal }
    ).Modal(document.getElementById('transferDetailsModal')!);
    modal.show();
  } catch (error) {
    console.error('Error fetching transfer details:', error);
    alert('Failed to load transfer details.');
  }
}

function formatLogInfo(logInfo: string): string {
  return logInfo
    .replace(/TRANSFER_/, '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function sendTransfer(id: string) {
  callApi('POST', `/transfer/send/${id}`, {})
    .then(() => {
      console.log(`Sent transfer with ID: ${id}`);
    })
    .catch((err) => {
      console.error(`Error sending transfer with ID: ${id}`, err);
      alert('Failed to send transfer.');
    });
}

function acceptTransfer(id: string) {
  callApi('POST', `/transfer/accept/${id}`, {})
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
  callApi('POST', `/transfer/refuse/${id}`, {})
    .then(() => {
      console.log(`Rejected transfer with ID: ${id}`);
      location.reload();
    })
    .catch((err) => {
      console.error(`Error refusing transfer with ID: ${id}`, err);
      alert('Failed to refuse transfer.');
    });
}

function retrieveTransfer(id: string) {
  callApi('POST', `/transfer/retrieve/${id}`, {})
    .then(() => {
      console.log(`Retrieved transfer with ID: ${id}`);
      location.reload();
    })
    .catch((err) => {
      console.error(`Error retrieving transfer with ID: ${id}`, err);
      alert('Failed to retrieve transfer.');
    });
}

async function downloadTransfer(id: string) {
  const userPrivateKey = await SecurityUtils.useUserPrivateKey();
  const downloader = FileDownloader.createDownloader(userPrivateKey);
  await downloader.downloadFile(id);
}

function deleteTransfer(id: string) {
  callApi('DELETE', `/transfer/delete/${id}`, {})
    .then(() => {
      console.log(`Deleted transfer with ID: ${id}`);
      location.reload();
    })
    .catch((err) => {
      console.error(`Error deleting transfer with ID: ${id}`, err);
      alert('Failed to delete transfer.');
    });
}

export function setupListPage() {
  const viewDetails = document.querySelectorAll('.view-details');
  const sendButtons = document.querySelectorAll('.send-btn');
  const acceptButtons = document.querySelectorAll('.accept-btn');
  const rejectButtons = document.querySelectorAll('.reject-btn');
  const retrieveButtons = document.querySelectorAll('.retrieve-btn');
  const downloadButtons = document.querySelectorAll('.download-btn');
  const deleteButtons = document.querySelectorAll('.delete-btn');
  const sizeElements = document.querySelectorAll('.size');

  viewDetails.forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-id');
      if (!id) return;
      void viewTransferDetails(id);
    });
  });

  sendButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-id');
      if (!id) return;
      sendTransfer(id);
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

  retrieveButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-id');
      if (!id) return;
      retrieveTransfer(id);
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

  sizeElements.forEach((element) => {
    const size = element.getAttribute('data-size');
    if (!size) return;
    element.textContent = formatFileSize(Number(size));
  });
}
