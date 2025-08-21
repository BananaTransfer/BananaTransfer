import type { Mocked } from '@suites/doubles.jest';
import { TestBed } from '@suites/unit';
import { ConfigService } from '@nestjs/config';

import { ExpirationService } from '../expiration.service';
import { BucketService } from '../bucket.service';
import { FileTransfer } from '@database/entities/file-transfer.entity';
import { TransferLog } from '@database/entities/transfer-log.entity';
import { TransferStatus, LogInfo } from '@database/entities/enums';

type FileTransferRepository = {
  find: jest.Mock<Promise<FileTransfer[]>, any>;
  save: jest.Mock<Promise<FileTransfer>, [FileTransfer]>;
  findOne: jest.Mock<Promise<FileTransfer | null>, any>;
};

type TransferLogRepository = {
  create: jest.Mock<TransferLog, any>;
  save: jest.Mock<Promise<TransferLog>, [TransferLog]>;
  createQueryBuilder: jest.Mock<any, any>;
};

describe('ExpirationService', () => {
  let expirationService: ExpirationService;
  let mockFileTransferRepository: Mocked<FileTransferRepository>;
  let mockTransferLogRepository: Mocked<TransferLogRepository>;
  let mockBucketService: Mocked<BucketService>;
  let mockConfigService: Mocked<ConfigService>;

  beforeEach(async () => {
    const builder = TestBed.solitary(ExpirationService);

    builder.mock(ConfigService);
    builder.mock(BucketService);
    builder.mock('FileTransferRepository');
    builder.mock('TransferLogRepository');

    const { unit, unitRef } = await builder.compile();

    expirationService = unit;
    mockFileTransferRepository = unitRef.get('FileTransferRepository');
    mockTransferLogRepository = unitRef.get('TransferLogRepository');
    mockBucketService = unitRef.get(BucketService);
    mockConfigService = unitRef.get(ConfigService);

    // Setup ConfigService mock
    mockConfigService.get.mockImplementation(
      (key: string, defaultValue?: any) => {
        const config = {
          TRANSFER_EXPIRY_CREATED_HOURS: 24,
          TRANSFER_EXPIRY_DAYS: 30,
          TRANSFER_LOG_EXPIRY_DAYS: 60,
        };
        return config[key] || defaultValue;
      },
    );

    jest.clearAllMocks();
  });

  describe('expireCreatedTransfers', () => {
    it('should expire CREATED transfers older than configured hours', async () => {
      const mockTransfer = {
        id: 'test-transfer-1',
        status: TransferStatus.CREATED,
        created_at: new Date('2023-01-01'),
      } as FileTransfer;

      mockFileTransferRepository.find.mockResolvedValue([mockTransfer]);
      mockFileTransferRepository.save.mockResolvedValue(mockTransfer);
      mockTransferLogRepository.create.mockReturnValue({} as TransferLog);
      mockTransferLogRepository.save.mockResolvedValue({} as TransferLog);
      mockBucketService.listFiles.mockResolvedValue([]);

      await expirationService.expireCreatedTransfers();

      expect(mockFileTransferRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: TransferStatus.EXPIRED }),
      );
      expect(mockTransferLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ info: LogInfo.TRANSFER_EXPIRED }),
      );
    });

    it('should not expire transfers newer than configured hours', async () => {
      mockFileTransferRepository.find.mockResolvedValue([]);

      await expirationService.expireCreatedTransfers();

      expect(mockFileTransferRepository.save).not.toHaveBeenCalled();
      expect(mockTransferLogRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('expireOldTransfers', () => {
    it('should expire old transfers with various status', async () => {
      const mockTransfer = {
        id: 'test-transfer-1',
        status: TransferStatus.UPLOADED,
        created_at: new Date('2023-01-01'),
      } as FileTransfer;

      // Mock different statuses returned by different queries
      mockFileTransferRepository.find
        .mockResolvedValueOnce([mockTransfer]) // UPLOADED
        .mockResolvedValueOnce([mockTransfer]) // SENT
        .mockResolvedValueOnce([mockTransfer]); // ACCEPTED

      mockFileTransferRepository.save.mockResolvedValue(mockTransfer);
      mockTransferLogRepository.create.mockReturnValue({} as TransferLog);
      mockTransferLogRepository.save.mockResolvedValue({} as TransferLog);
      mockBucketService.listFiles.mockResolvedValue(['file1', 'file2']);
      mockBucketService.deleteFile.mockResolvedValue(undefined);

      await expirationService.expireOldTransfers();

      expect(mockBucketService.deleteFile).toHaveBeenCalledTimes(6);
      expect(mockFileTransferRepository.save).toHaveBeenCalledTimes(3);
    });
  });

  describe('cleanupTransferLogs', () => {
    it('should delete old transfer logs', async () => {
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 5 }),
      };

      mockTransferLogRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      await expirationService.cleanupTransferLogs();

      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.from).toHaveBeenCalledWith(TransferLog);
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });
  });
});
