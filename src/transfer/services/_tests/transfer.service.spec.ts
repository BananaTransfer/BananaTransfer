import { Test, TestingModule } from '@nestjs/testing';
// import { ConfigService } from '@nestjs/config';
import { BucketService } from '@transfer/services/bucket.service';
import { UserService } from '@user/services/user.service';
import { RecipientService } from '@user/services/recipient.service';
import { TransferService } from '@transfer/services/transfer.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FileTransfer } from '@database/entities/file-transfer.entity';
import { TransferLog } from '@database/entities/transfer-log.entity';
import { Repository } from 'typeorm';
import { TransferStatus } from '@database/entities/enums';

describe('TransferService', () => {
  let service: TransferService;
  let fileTransferRepository: Repository<FileTransfer>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferService,
        {
          provide: getRepositoryToken(FileTransfer),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TransferLog),
          useValue: {},
        },
        {
          provide: BucketService,
          useValue: {
            listFiles: jest.fn(),
            putObject: jest.fn(),
            getFile: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {},
        },
        {
          provide: RecipientService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<TransferService>(TransferService);
    fileTransferRepository = module.get<Repository<FileTransfer>>(
      getRepositoryToken(FileTransfer),
    );
  });

  it('should refuse a valid transfer', async () => {
    const transfer = {
      id: 1,
      status: TransferStatus.UPLOADED,
      receiver: { id: 2 },
    };
    (fileTransferRepository.findOne as jest.Mock).mockResolvedValue(transfer);
    (fileTransferRepository.save as jest.Mock).mockResolvedValue({
      ...transfer,
      status: TransferStatus.REFUSED,
    });
    (service as any).createTransferLog = jest.fn().mockResolvedValue({});

    const result = await service.refuseTransfer(1);
    expect(result).toBe('Transfer with ID 1 refused');
    expect(transfer.status).toBe(TransferStatus.REFUSED);
  });

  it('should throw if transfer not found', async () => {
    (fileTransferRepository.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.refuseTransfer(999)).rejects.toThrow(
      'Transfer with ID 999 not found',
    );
  });

  it('should throw if already refused', async () => {
    const transfer = {
      id: 1,
      status: TransferStatus.REFUSED,
      receiver: { id: 2 },
    };
    (fileTransferRepository.findOne as jest.Mock).mockResolvedValue(transfer);
    await expect(service.refuseTransfer(1)).rejects.toThrow(
      'Transfer is not pending acceptance or refusal',
    );
  });

  it('should throw if already accepted', async () => {
    const transfer = {
      id: 1,
      status: TransferStatus.RETRIEVED,
      receiver: { id: 2 },
    };
    (fileTransferRepository.findOne as jest.Mock).mockResolvedValue(transfer);
    await expect(service.refuseTransfer(1)).rejects.toThrow(
      'Transfer is not pending acceptance or refusal',
    );
  });
});
