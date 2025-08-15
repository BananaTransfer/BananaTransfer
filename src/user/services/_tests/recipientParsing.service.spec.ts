import RecipientParsingService, {
  MalformedRecipientException,
} from '@user/services/recipientParsing.service';
import { ConfigService } from '@nestjs/config';

describe('RecipientParsingService', () => {
  let parser: RecipientParsingService;
  const localDomain = 'localDomain';

  beforeEach(() => {
    process.env.DOMAIN = localDomain;
    parser = new RecipientParsingService(new ConfigService());
  });

  describe('parseRecipient', () => {
    test.each(['test@plouf@other', '', '@localhost.ch', 'test@'])(
      'should throw if the provided recipient is invalid (%s)',
      (recipient: string) => {
        expect(() => parser.parseRecipient(recipient)).toThrow(
          MalformedRecipientException,
        );
      },
    );

    test('should parse local recipient', () => {
      const result = parser.parseRecipient(`test@${localDomain}`);
      expect(result.isLocal).toBeTruthy();
      expect(result.domain).toEqual(localDomain);
      expect(result.username).toEqual('test');
    });

    test('should parse remote user', () => {
      const result = parser.parseRecipient(`plouf@google.com`);
      expect(result.isLocal).toBeFalsy();
      expect(result.domain).toEqual('google.com');
      expect(result.username).toEqual('plouf');
    });
  });
});
