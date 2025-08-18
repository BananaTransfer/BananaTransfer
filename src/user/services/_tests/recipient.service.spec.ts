import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';

import { RecipientService } from '@user/services/recipient.service';
import { RemoteService } from '@remote/services/remote.service';
import { UserService } from '@user/services/user.service';
import { RemoteUserService } from '@user/services/remoteUser.service';
import { HashKeyService } from '@user/services/hashKey.service';
import { MalformedRecipientException } from '@user/types/malformed-recipient-exception.type';
import { LocalUser } from '@database/entities/local-user.entity';
import { RemoteUser } from '@database/entities/remote-user.entity';
import { TrustedRecipient } from '@database/entities/trusted-recipient.entity';

describe('RecipientService', () => {
  let service: RecipientService;
  let trustedRecipientRepository: jest.Mocked<Repository<TrustedRecipient>>;
  const localDomain = 'localDomain';

  beforeEach(async () => {
    process.env.DOMAIN = localDomain;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipientService,
        ConfigService,
        {
          provide: RemoteService,
          useValue: {
            // mock methods as needed
            someMethod: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            // mock methods as needed
            someMethod: jest.fn(),
          },
        },
        {
          provide: RemoteUserService,
          useValue: {
            // mock methods as needed
            someMethod: jest.fn(),
          },
        },
        {
          provide: HashKeyService,
          useValue: {
            // mock methods as needed
            someMethod: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TrustedRecipient),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            // add other methods as needed
          },
        },
      ],
    }).compile();

    service = module.get<RecipientService>(RecipientService);
    trustedRecipientRepository = module.get(
      getRepositoryToken(TrustedRecipient),
    );
  });

  describe('parseRecipient', () => {
    test.each(['test@plouf@other', '', '@localhost.ch', 'test@'])(
      'should throw if the provided recipient is invalid (%s)',
      (recipient: string) => {
        expect(() => service.parseRecipient(recipient)).toThrow(
          MalformedRecipientException,
        );
      },
    );

    test('should parse local recipient', () => {
      const result = service.parseRecipient(`test@${localDomain}`);
      expect(result.isLocal).toBeTruthy();
      expect(result.domain).toEqual(localDomain);
      expect(result.username).toEqual('test');
    });

    test('should parse remote user', () => {
      const result = service.parseRecipient(`plouf@google.com`);
      expect(result.isLocal).toBeFalsy();
      expect(result.domain).toEqual('google.com');
      expect(result.username).toEqual('plouf');
    });
  });

  describe('getKnownRecipients', () => {
    test('should return an array of known recipients', async () => {
      trustedRecipientRepository.find.mockResolvedValue([
        {
          id: 1,
          created_at: new Date(),
          user: { username: 'alice', domain: 'example.com' } as RemoteUser,
          localUser: { id: 1, username: 'alice' } as LocalUser,
          public_key_hash: 'hash1',
        } as TrustedRecipient,
        {
          id: 2,
          created_at: new Date(),
          user: { username: 'bob' } as LocalUser,
          localUser: { id: 1, username: 'bob' } as LocalUser,
          public_key_hash: 'hash2',
        } as TrustedRecipient,
      ]);
      const result = await service.getKnownRecipients(1);
      expect(result).toBeInstanceOf(Array);
    });
  });
});
