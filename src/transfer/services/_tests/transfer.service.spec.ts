// import type { Mocked } from '@suites/doubles.jest';
// import type { Repository } from 'typeorm';
// import { NotFoundException } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { MinioContainer, StartedMinioContainer } from '@testcontainers/minio';
// import {
//   CreateBucketCommand,
//   BucketLocationConstraint,
//   S3Client,
// } from '@aws-sdk/client-s3';
//
// import { TransferService } from '@transfer/services/transfer.service';
// import { BucketService } from '@transfer/services/bucket.service';
// import { FileTransfer } from '@database/entities/file-transfer.entity';
// import { TransferLog } from '@database/entities/transfer-log.entity';
// import { User } from '@database/entities/user.entity';
// import { TransferStatus, LogInfo } from '@database/entities/enums';
//
// describe('TransferService', () => {
//   jest.setTimeout(60000);
//
//   let transferService: TransferService;
//   let bucketService: BucketService;
//   let fileTransferRepository: Mocked<Repository<FileTransfer>>;
//   let transferLogRepository: Mocked<Repository<TransferLog>>;
//   // let _chunkInfoRepository: Mocked<Repository<ChunkInfo>>;
//   let userRepository: Mocked<Repository<User>>;
//   let minioContainer: StartedMinioContainer;
//
//   beforeAll(async () => {
//     // Start MinIO container using MinioContainer
//     minioContainer = await new MinioContainer('minio/minio:latest').start();
//
//     process.env.S3_ENDPOINT = minioContainer.getConnectionUrl();
//     process.env.S3_REGION = 'us-east-1';
//     process.env.S3_CLIENT_ID = minioContainer.getUsername();
//     process.env.S3_CLIENT_SECRET = minioContainer.getPassword();
//     process.env.S3_BUCKET = 'testbucket';
//   });
//
//   beforeEach(async () => {
//     // Create real BucketService with MinIO
//     bucketService = new BucketService(new ConfigService());
//
//     // Ensure the bucket exists
//     const s3Client = (bucketService as unknown as { s3Client: S3Client })
//       .s3Client;
//     try {
//       await s3Client.send(
//         new CreateBucketCommand({
//           Bucket: process.env.S3_BUCKET,
//           CreateBucketConfiguration: {
//             LocationConstraint: process.env
//               .S3_REGION as BucketLocationConstraint,
//           },
//         }),
//       );
//     } catch (error: unknown) {
//       // Ignore bucket already exists error
//       const isError = error && typeof error === 'object' && 'name' in error;
//       const hasExpectedName =
//         isError &&
//         typeof (error as { name: unknown }).name === 'string' &&
//         (error as { name: string }).name.includes('BucketAlreadyOwnedByYou');
//
//       if (!hasExpectedName) {
//         throw error;
//       }
//     }
//
//     // Create TransferService manually with real BucketService and mocked repositories
//     // Using jest.fn() objects that match the Repository interface we actually use
//     const mockFileTransferRepository = {
//       create: jest.fn(),
//       save: jest.fn(),
//       find: jest.fn(),
//       findOne: jest.fn(),
//     };
//
//     const mockTransferLogRepository = {
//       create: jest.fn(),
//       save: jest.fn(),
//       find: jest.fn(),
//     };
//
//     const mockUserRepository = {
//       findOne: jest.fn(),
//     };
//
//     transferService = new TransferService(
//       bucketService,
//       mockFileTransferRepository as unknown as Repository<FileTransfer>,
//       mockTransferLogRepository as unknown as Repository<TransferLog>,
//       mockUserRepository as unknown as Repository<User>,
//     );
//
//     fileTransferRepository = mockFileTransferRepository as Mocked<
//       Repository<FileTransfer>
//     >;
//     transferLogRepository = mockTransferLogRepository as Mocked<
//       Repository<TransferLog>
//     >;
//     // _chunkInfoRepository = mockChunkInfoRepository as Mocked<
//     //   Repository<ChunkInfo>
//     // >;
//     userRepository = mockUserRepository as Mocked<Repository<User>>;
//   });
//
//   afterAll(async () => {
//     await minioContainer.stop();
//   });
//
//   it('service should be defined', () => {
//     expect(transferService).toBeDefined();
//   });
//
//   describe('newTransfer', () => {
//     test('should create transfer with file upload', async () => {
//       // given
//       const transferData = {
//         filename: 'test-file.txt',
//         subject: 'Test Transfer',
//         recipientUsername: 'recipient@test.com',
//         symmetricKeyEncrypted: 'encrypted-key',
//         signatureSender: 'sender-signature',
//         fileContent: Buffer.from('test file content'),
//         totalFileSize: 17,
//       };
//       const senderId = 1;
//
//       const mockSender = { id: 1, username: 'sender' } as User;
//       const mockRecipient = { id: 2, username: 'recipient' } as User;
//       const mockTransfer = {
//         id: 123,
//         filename: 'test-file.txt',
//         status: TransferStatus.CREATED,
//         s3_path: '',
//         subject: 'Test Transfer',
//         symmetric_key_encrypted: 'encrypted-key',
//         signature_sender: 'sender-signature',
//         created_at: new Date(),
//         sender: mockSender,
//         receiver: mockRecipient,
//         logs: [],
//       } as FileTransfer;
//       const mockLog = { id: 1, info: LogInfo.TRANSFER_CREATED } as TransferLog;
//
//       // Mock repository responses
//       userRepository.findOne.mockResolvedValueOnce(mockSender);
//       userRepository.findOne.mockResolvedValueOnce(mockRecipient);
//       fileTransferRepository.create.mockReturnValue(mockTransfer);
//       fileTransferRepository.save.mockResolvedValueOnce({ ...mockTransfer });
//       fileTransferRepository.save.mockResolvedValueOnce({
//         ...mockTransfer,
//         s3_path: 'transfers/123/test-file.txt',
//         status: TransferStatus.SENT,
//       });
//       transferLogRepository.create.mockReturnValue(mockLog);
//       transferLogRepository.save.mockResolvedValue(mockLog);
//
//       // when
//       const result = await transferService.newTransfer(transferData, senderId);
//
//       // then
//       expect(result).toBeDefined();
//       expect(userRepository.findOne).toHaveBeenCalledWith({
//         where: { id: senderId },
//       });
//       expect(fileTransferRepository.create).toHaveBeenCalledWith({
//         filename: transferData.filename,
//         subject: transferData.subject,
//         symmetric_key_encrypted: transferData.symmetricKeyEncrypted,
//         signature_sender: transferData.signatureSender,
//         sender: mockSender,
//         receiver: mockRecipient,
//         status: TransferStatus.CREATED,
//       });
//       expect(fileTransferRepository.save).toHaveBeenCalledTimes(2);
//       expect(transferLogRepository.create).toHaveBeenCalledTimes(2);
//     });
//
//     test('should create transfer without file upload', async () => {
//       // given
//       const transferData = {
//         filename: 'test-file.txt',
//         subject: 'Test Transfer',
//         recipientUsername: 'recipient@test.com',
//         symmetricKeyEncrypted: 'encrypted-key',
//         signatureSender: 'sender-signature',
//       };
//       const senderId = 1;
//
//       const mockSender = { id: 1, username: 'sender' } as User;
//       const mockRecipient = { id: 2, username: 'recipient' } as User;
//       const mockTransfer = {
//         id: 123,
//         filename: 'test-file.txt',
//         status: TransferStatus.CREATED,
//         subject: 'Test Transfer',
//         symmetric_key_encrypted: 'encrypted-key',
//         signature_sender: 'sender-signature',
//         created_at: new Date(),
//         sender: mockSender,
//         receiver: mockRecipient,
//         s3_path: '',
//         logs: [],
//       } as FileTransfer;
//       const mockLog = { id: 1, info: LogInfo.TRANSFER_CREATED } as TransferLog;
//
//       userRepository.findOne.mockResolvedValueOnce(mockSender);
//       userRepository.findOne.mockResolvedValueOnce(mockRecipient);
//       fileTransferRepository.create.mockReturnValue(mockTransfer);
//       fileTransferRepository.save.mockResolvedValue(mockTransfer);
//       transferLogRepository.create.mockReturnValue(mockLog);
//       transferLogRepository.save.mockResolvedValue(mockLog);
//
//       // when
//       const result = await transferService.newTransfer(transferData, senderId);
//
//       // then
//       expect(result).toBeDefined();
//       expect(result.status).toBe(TransferStatus.CREATED);
//       // Should only create transfer log once (no upload log)
//       expect(transferLogRepository.create).toHaveBeenCalledTimes(1);
//     });
//
//     test('should throw error if sender not found', async () => {
//       // given
//       const transferData = {
//         filename: 'test-file.txt',
//         subject: 'Test Transfer',
//         recipientUsername: 'recipient@test.com',
//         symmetricKeyEncrypted: 'encrypted-key',
//         signatureSender: 'sender-signature',
//       };
//       const senderId = 999;
//
//       userRepository.findOne.mockResolvedValue(null);
//
//       // when + then
//       await expect(
//         transferService.newTransfer(transferData, senderId),
//       ).rejects.toThrow(NotFoundException);
//       await expect(
//         transferService.newTransfer(transferData, senderId),
//       ).rejects.toThrow('Sender not found');
//     });
//   });
//
//   describe('getTransferList', () => {
//     test('should return transfers for user', async () => {
//       // given
//       const userId = 1;
//       const mockTransfers = [
//         { id: 1, filename: 'file1.txt' },
//         { id: 2, filename: 'file2.txt' },
//       ] as FileTransfer[];
//
//       fileTransferRepository.find.mockResolvedValue(mockTransfers);
//
//       // when
//       const result = await transferService.getTransferList(userId);
//
//       // then
//       expect(result).toEqual(mockTransfers);
//       expect(fileTransferRepository.find).toHaveBeenCalledWith({
//         where: [{ sender: { id: userId } }, { receiver: { id: userId } }],
//         relations: ['sender', 'receiver'],
//       });
//     });
//   });
//
//   describe('getTransferDetails', () => {
//     test('should return transfer and logs for valid transfer', async () => {
//       // given
//       const transferId = 1;
//       const userId = 1;
//       const mockTransfer = {
//         id: transferId,
//         filename: 'test.txt',
//       } as FileTransfer;
//       const mockLogs = [
//         { id: 1, info: LogInfo.TRANSFER_CREATED },
//       ] as TransferLog[];
//
//       fileTransferRepository.findOne.mockResolvedValue(mockTransfer);
//       transferLogRepository.find.mockResolvedValue(mockLogs);
//
//       // when
//       const result = await transferService.getTransferDetails(
//         transferId,
//         userId,
//       );
//
//       // then
//       expect(result).toEqual([mockTransfer, mockLogs]);
//       expect(fileTransferRepository.findOne).toHaveBeenCalledWith({
//         where: [
//           { id: transferId, sender: { id: userId } },
//           { id: transferId, receiver: { id: userId } },
//         ],
//         relations: ['sender', 'receiver'],
//       });
//       expect(transferLogRepository.find).toHaveBeenCalledWith({
//         where: { fileTransfer: { id: transferId } },
//       });
//     });
//
//     test('should throw NotFoundException if transfer not found', async () => {
//       // given
//       const transferId = 999;
//       const userId = 1;
//
//       fileTransferRepository.findOne.mockResolvedValue(null);
//
//       // when + then
//       await expect(
//         transferService.getTransferDetails(transferId, userId),
//       ).rejects.toThrow(NotFoundException);
//       await expect(
//         transferService.getTransferDetails(transferId, userId),
//       ).rejects.toThrow(`Transfer with ID ${transferId} not found`);
//     });
//   });
// });
