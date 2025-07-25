import { Test, TestingModule } from '@nestjs/testing';
import { RemoteService } from './remote.service';

describe('RemoteService', () => {
  let remoteService: RemoteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RemoteService],
    }).compile();

    remoteService = module.get<RemoteService>(RemoteService);
  });

  describe('remoteService', () => {
    it('service should be defined', () => {
      expect(remoteService).toBeDefined();
    });
  });

  // TODO: Add tests for all methods in RemoteService
});
