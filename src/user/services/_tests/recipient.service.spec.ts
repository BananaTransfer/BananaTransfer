import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RecipientService } from '@user/services/recipient.service';
import { RemoteService } from '@remote/services/remote.service';
import { UserService } from '@user/services/user.service';
import { RemoteUserService } from '@user/services/remoteUser.service';
import { MalformedRecipientException } from '@user/types/malformed-recipient-exception.type';

describe('RecipientService', () => {
  let service: RecipientService;
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
      ],
    }).compile();
    service = module.get<RecipientService>(RecipientService);
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
});
