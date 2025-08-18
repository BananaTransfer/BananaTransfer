import type { Mocked } from '@suites/doubles.jest';
import { TestBed } from '@suites/unit';
import { TransferService } from '@transfer/services/transfer.service';
import { FileTransfer } from '@database/entities/file-transfer.entity';
import { TransferStatus } from '@database/entities/enums';
import { BucketService } from '@transfer/services/bucket.service';
import { UserService } from '@user/services/user.service';
import { RecipientService } from '@user/services/recipient.service';

describe('TransferService', () => {
  let transferService: TransferService;
  let mockFileTransferRepository: Mocked<any>;
  let mockTransferLogRepository: Mocked<any>;
  let mockBucketService: Mocked<BucketService>;
  let mockUserService: Mocked<UserService>;
  let mockRecipientService: Mocked<RecipientService>;

  beforeEach(async () => {
    const builder = TestBed.solitary(TransferService);

    builder.mock(BucketService);
    builder.mock(UserService);
    builder.mock(RecipientService);
    builder.mock('FileTransferRepository');
    builder.mock('TransferLogRepository');

    const { unit, unitRef } = await builder.compile();

    transferService = unit;
    mockFileTransferRepository = unitRef.get('FileTransferRepository');
    mockTransferLogRepository = unitRef.get('TransferLogRepository');
    mockBucketService = unitRef.get(BucketService);
    mockUserService = unitRef.get(UserService);
    mockRecipientService = unitRef.get(RecipientService);

    // Reset all relevant mocks
    Object.values(mockFileTransferRepository).forEach((v) => v?.mockReset?.());
    Object.values(mockTransferLogRepository).forEach((v) => v?.mockReset?.());
    Object.values(mockBucketService).forEach((v) => v?.mockReset?.());
    Object.values(mockUserService).forEach((v) => v?.mockReset?.());
    Object.values(mockRecipientService).forEach((v) => v?.mockReset?.());
  });

  describe('acceptTransfer', () => {
    it('should accept a transfer', async () => {
      const transfer = {
        id: 'transfer-id',
        receiver: { id: 2 },
        sender: { id: 1 },
        status: TransferStatus.SENT,
      } as FileTransfer;

      mockFileTransferRepository.findOne.mockResolvedValue(transfer);
      mockFileTransferRepository.save.mockImplementation(
        async (t) => ({ ...t }) as FileTransfer,
      );
      mockTransferLogRepository.create.mockReturnValue({} as any);
      mockTransferLogRepository.save.mockResolvedValue({} as any);

      const result = await transferService.acceptTransfer('transfer-id', 2);

      expect(result.status).toBe(TransferStatus.RETRIEVED);
      expect(mockFileTransferRepository.save).toHaveBeenCalledWith({
        ...transfer,
        status: TransferStatus.RETRIEVED,
      });
    });

    it('should throw if transfer is not SENT', async () => {
      const transfer = {
        id: 'transfer-id',
        receiver: { id: 2 },
        sender: { id: 1 },
        status: TransferStatus.UPLOADED,
      } as FileTransfer;

      mockFileTransferRepository.findOne.mockResolvedValue(transfer);

      await expect(
        transferService.acceptTransfer('transfer-id', 2),
      ).rejects.toThrow('Transfer is not pending acceptance or refusal');
    });
  });

  describe('refuseTransfer', () => {
    it('should refuse a transfer', async () => {
      const transfer = {
        id: 'transfer-id',
        receiver: { id: 2 },
        sender: { id: 1 },
        status: TransferStatus.SENT,
      } as FileTransfer;

      mockFileTransferRepository.findOne.mockResolvedValue(transfer);
      mockFileTransferRepository.save.mockImplementation(
        async (t) => ({ ...t }) as FileTransfer,
      );
      mockTransferLogRepository.create.mockReturnValue({} as any);
      mockTransferLogRepository.save.mockResolvedValue({} as any);

      const result = await transferService.refuseTransfer('transfer-id', 2);

      expect(result.status).toBe(TransferStatus.REFUSED);
      expect(mockFileTransferRepository.save).toHaveBeenCalledWith({
        ...transfer,
        status: TransferStatus.REFUSED,
      });
    });

    it('should throw if transfer is not SENT', async () => {
      const transfer = {
        id: 'transfer-id',
        receiver: { id: 2 },
        sender: { id: 1 },
        status: TransferStatus.RETRIEVED,
      } as FileTransfer;

      mockFileTransferRepository.findOne.mockResolvedValue(transfer);

      await expect(
        transferService.refuseTransfer('transfer-id', 2),
      ).rejects.toThrow('Transfer is not pending acceptance or refusal');
    });
  });
});
