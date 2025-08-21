import type { Mocked } from '@suites/doubles.jest';
import { TestBed } from '@suites/unit';

import { ExpirationService } from '../expiration.service';
import { FileTransfer } from '@database/entities/file-transfer.entity';
import { TransferStatus } from '@database/entities/enums';
import { TransferService } from '@transfer/services/transfer.service';
import { ConfigService } from '@nestjs/config';

describe('ExpirationService', () => {
  let expirationService: ExpirationService;
  let mockTransferService: Mocked<TransferService>;

  beforeEach(async () => {
    const builder = TestBed.solitary(ExpirationService);
    builder.mock(TransferService);
    builder.mock(ConfigService).final(new ConfigService());
    const { unit, unitRef } = await builder.compile();

    expirationService = unit;
    mockTransferService = unitRef.get(TransferService);
  });
  const checkListTransferArguments = (
    status: TransferStatus[],
    hourBeforeNow: number,
  ) => {
    expect(
      mockTransferService.getTransferListByStatusAndCreationTime,
    ).toHaveBeenCalledWith(status, expect.any(Date));

    const actualCall =
      mockTransferService.getTransferListByStatusAndCreationTime.mock.calls[0];
    const actualDate = actualCall[1];

    expect(actualDate).toBeInstanceOf(Date);
    expect(actualDate.getTime()).not.toBeNaN();
    expect(actualDate.getTime()).toBeLessThan(
      Date.now() - hourBeforeNow * 60 * 60 * 1000,
    );
  };

  describe('expireCreatedTransfers', () => {
    it('should expire CREATED transfers older than configured hours', async () => {
      // given
      const mockTransfer = {
        id: 'test-transfer-1',
        status: TransferStatus.CREATED,
        created_at: new Date('2023-01-01'),
      } as FileTransfer;

      mockTransferService.getTransferListByStatusAndCreationTime.mockResolvedValue(
        [mockTransfer],
      );

      // when
      await expirationService.expireCreatedTransfers();

      // then
      checkListTransferArguments([TransferStatus.CREATED], 20);

      expect(mockTransferService.expireLocalTransfer).toHaveBeenCalledWith(
        mockTransfer,
      );
    });
  });

  describe('expireOldTransfers', () => {
    it('should expire old transfers with various status', async () => {
      // given
      const mockTransfer = {
        id: 'test-transfer-1',
        status: TransferStatus.UPLOADED,
        created_at: new Date('2023-01-01'),
      } as FileTransfer;

      mockTransferService.getTransferListByStatusAndCreationTime.mockResolvedValue(
        [mockTransfer],
      );

      // when
      await expirationService.expireOldTransfers();

      // then
      checkListTransferArguments(
        [
          TransferStatus.UPLOADED,
          TransferStatus.ACCEPTED,
          TransferStatus.REFUSED,
          TransferStatus.SENT,
          TransferStatus.RETRIEVED,
        ],
        29 * 24,
      );

      expect(mockTransferService.expireLocalTransfer).toHaveBeenCalledWith(
        mockTransfer,
      );
    });
  });

  describe('cleanupTransferLogs', () => {
    it('should delete old transfer logs', async () => {
      // given
      const mockTransfer = {
        id: 'test-transfer-1',
        status: TransferStatus.CREATED,
        created_at: new Date('2023-01-01'),
      } as FileTransfer;

      mockTransferService.getTransferListByStatusAndCreationTime.mockResolvedValue(
        [mockTransfer],
      );

      // when
      await expirationService.cleanupTransferLogs();

      // then
      checkListTransferArguments(
        [TransferStatus.DELETED, TransferStatus.EXPIRED],
        59 * 24,
      );

      expect(
        mockTransferService.deleteLocalTransferPermanently,
      ).toHaveBeenCalledWith(mockTransfer);
    });
  });
});
