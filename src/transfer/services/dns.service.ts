import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Resolver, NOTFOUND } from 'dns/promises';
import validator from 'validator';

@Injectable()
export class DnsService {
  private readonly logger: Logger;
  private readonly resolver: Resolver;

  constructor(resolver: Resolver) {
    this.resolver = resolver;
    this.logger = new Logger(DnsService.name);
  }

  /**
   * Given a user domain, return the domain of the server hosting the BananaTransfer instance
   */
  public async getServerAddress(domain: string): Promise<string> {
    try {
      this.logger.debug(`Resolving server address for ${domain}`);
      const result = await this.resolver.resolveTxt(
        '_bananatransfer.' + domain,
      );

      if (
        result.length != 1 ||
        result[0].length != 1 ||
        !validator.isFQDN(result[0][0], {
          allow_wildcard: false,
          allow_trailing_dot: false,
          allow_numeric_tld: false,
          require_tld: true,
        })
      ) {
        throw new InvalidDomainException(
          `the provided domain is missconfigured`,
        );
      }

      return result[0][0];
    } catch (err: any) {
      const code = (err as { code: string }).code;

      if (code == NOTFOUND) {
        throw new InvalidDomainException(
          'the provided domain is not hosting a bananantransfer server',
        );
      }

      this.logger.error(
        `Could not fetch the server address for ${domain}`,
        err,
      );
      throw new InternalServerErrorException(err);
    }
  }
}

export class InvalidDomainException extends HttpException {
  constructor(message: string) {
    super(message, 400);
  }
}
