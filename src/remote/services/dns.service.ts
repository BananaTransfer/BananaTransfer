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

  private isFQDN(domain: string): boolean {
    return validator.isFQDN(domain, {
      allow_wildcard: false,
      allow_trailing_dot: false,
      allow_numeric_tld: false,
      require_tld: true,
    });
  }

  private async resolveTxt(domain: string): Promise<string[][]> {
    this.logger.debug(`Resolving server address for ${domain}`);
    try {
      return await this.resolver.resolveTxt(domain);
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

  /**
   * Given a user domain, return the domain of the server hosting the BananaTransfer instance
   */
  public async getServerAddress(domain: string): Promise<string> {
    if (!this.isFQDN(domain)) {
      this.logger.error(`${domain} is not a valid fQDN`);
      throw new InvalidDomainException('The provided domain is invalid.');
    }

    this.logger.debug(`Resolving server address for ${domain}`);
    const result = await this.resolveTxt('_bananatransfer.' + domain);

    if (
      result.length != 1 ||
      result[0].length != 1 ||
      !this.isFQDN(result[0][0])
    ) {
      throw new InvalidDomainException(
        `The provided domain ${domain} is misconfigured`,
      );
    }

    return result[0][0];
  }

  public async getServerIpAddresses(domain: string): Promise<string[]> {
    this.logger.debug(
      `Resolving BananaTransfer server IP addresses for domain ${domain}`,
    );
    const hostname = await this.getServerAddress(domain);
    const addresses = await this.resolver.resolve4(hostname);
    if (addresses.length === 0) {
      throw new InvalidDomainException(
        `No IP addresses found for hostname ${hostname}`,
      );
    }
    return addresses;
  }
}

export class InvalidDomainException extends HttpException {
  constructor(message: string) {
    super(message, 400);
  }
}
