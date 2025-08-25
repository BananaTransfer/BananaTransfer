import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { RemoteRequest } from '@remote/types/remote-request.type';
import { DnsService } from '@remote/services/dns.service';

// TODO: check mTLS of sender server or check signature of request

@Injectable()
export class RemoteGuard implements CanActivate {
  private readonly logger = new Logger(RemoteGuard.name);

  constructor(private readonly dnsService: DnsService) {}

  /**
   * Check the incoming request from a remote BananaTransfer server
   * Validate if the IP address of the request matches the resolved IPs of the server of the domain
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RemoteRequest>();
    const remoteDomain = req.headers['x-bananatransfer-domain'];
    if (!remoteDomain || typeof remoteDomain !== 'string') {
      this.logger.warn('Missing or invalid BananaTransfer-domain in header');
      throw new ForbiddenException(
        'Missing or invalid BananaTransfer-domain in header',
      );
    }

    // get IP the request was forwarded for from the reverse proxy
    const forwardedFor = req.headers['x-forwarded-for'] as string | undefined;
    // if no x-forwarded-for header is present, fallback to req.ip
    const remoteServerIp = forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : req.ip;

    if (!remoteServerIp) {
      this.logger.warn('Missing or invalid sender IP in header');
      throw new ForbiddenException('Missing or invalid sender IP in header');
    }

    // Resolve the domain to the hostname of the BananaTransfer server
    let ipAddresses: string[];
    try {
      ipAddresses = await this.dnsService.getServerIpAddresses(remoteDomain);
    } catch (err) {
      this.logger.warn(
        (err as Error)?.message || 'Could not resolve ip addresses of domain',
      );
      throw new ForbiddenException(
        (err as Error)?.message || 'Could not resolve ip addresses of domain',
      );
    }

    // Compare the request IP to the resolved IPs
    if (!ipAddresses.includes(remoteServerIp)) {
      this.logger.warn(
        `Sender IP ${remoteServerIp} does not match resolved ip addresses of remote domain`,
      );
      throw new ForbiddenException(
        `Sender IP does not match resolved ip addresses of remote domain`,
      );
    }

    req.domain = remoteDomain;
    return true;
  }
}
