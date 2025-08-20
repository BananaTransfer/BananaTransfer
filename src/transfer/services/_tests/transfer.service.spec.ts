import type { Mocked } from '@suites/doubles.jest';
import { TestBed } from '@suites/unit';
import { TransferService } from '@transfer/services/transfer.service';
import { FileTransfer } from '@database/entities/file-transfer.entity';
import { TransferStatus } from '@database/entities/enums';
import { BucketService } from '@transfer/services/bucket.service';
import { UserService } from '@user/services/user.service';
import { RecipientService } from '@user/services/recipient.service';

type FileTransferRepository = {
  findOne: jest.Mock<Promise<FileTransfer | undefined>, any>;
  save: jest.Mock<Promise<FileTransfer>, [FileTransfer]>;
  create: jest.Mock<any, any>;
};

type TransferLogRepository = {
  create: jest.Mock<any, any>;
  save: jest.Mock<Promise<any>, [any]>;
};

describe('TransferService', () => {
  let transferService: TransferService;
  let mockFileTransferRepository: Mocked<FileTransferRepository>;
  let mockTransferLogRepository: Mocked<TransferLogRepository>;
  //let mockBucketService: Mocked<BucketService>;
  //let mockUserService: Mocked<UserService>;
  //let mockRecipientService: Mocked<RecipientService>;

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
    //mockBucketService = unitRef.get(BucketService);
    //mockUserService = unitRef.get(UserService);
    //mockRecipientService = unitRef.get(RecipientService);

    jest.clearAllMocks();
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
      mockFileTransferRepository.save.mockImplementation((t) =>
        Promise.resolve({ ...t } as FileTransfer),
      );
      mockTransferLogRepository.create.mockReturnValue({} as any);
      mockFileTransferRepository.save.mockImplementation((t) =>
        Promise.resolve({ ...t } as FileTransfer),
      );

      const result = await transferService.acceptTransfer('transfer-id', 2);

      expect(result.status).toBe(TransferStatus.ACCEPTED);
      expect(mockFileTransferRepository.save).toHaveBeenCalledWith({
        ...transfer,
        status: TransferStatus.ACCEPTED,
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
      mockFileTransferRepository.save.mockImplementation((t) =>
        Promise.resolve({ ...t } as FileTransfer),
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
