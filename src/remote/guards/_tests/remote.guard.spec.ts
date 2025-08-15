import { RemoteGuard } from '../remote.guard';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';

describe('RemoteGuard', () => {
  let guard: RemoteGuard;
  let dnsService: { getServerIpAddresses: jest.Mock };

  beforeEach(() => {
    dnsService = {
      getServerIpAddresses: jest.fn(),
    };
    guard = new RemoteGuard(dnsService as any);
  });

  function mockContext(
    headers: Record<string, string | undefined>,
    ip = '1.2.3.4',
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
          ip,
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow if ip is missing in header but present in request and matches resolved IPs', async () => {
    dnsService.getServerIpAddresses.mockResolvedValue(['1.2.3.4']);
    const context = mockContext(
      { 'x-bananatransfer-domain': 'example.com' },
      '1.2.3.4',
    );
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should allow if IP x-forwarded-for matches resolved IPs', async () => {
    dnsService.getServerIpAddresses.mockResolvedValue(['1.2.3.4']);
    const context = mockContext(
      {
        'x-bananatransfer-domain': 'example.com',
        'x-forwarded-for': '1.2.3.4',
      },
      '4.5.6.7',
    );
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should throw if header is missing', async () => {
    const context = mockContext({});
    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw if domain is missing in header', async () => {
    dnsService.getServerIpAddresses.mockResolvedValue(['1.2.3.4']);
    const context = mockContext({
      'x-forwarded-for': '1.2.3.4',
    });
    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw if ip is missing in header and request', async () => {
    dnsService.getServerIpAddresses.mockResolvedValue(['1.2.3.4']);
    const context = mockContext(
      { 'x-bananatransfer-domain': 'example.com' },
      '',
    );
    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw if IP in header does not match', async () => {
    dnsService.getServerIpAddresses.mockResolvedValue(['5.6.7.8']);
    const context = mockContext({
      'x-bananatransfer-domain': 'example.com',
      'x-forwarded-for': '1.2.3.4',
    });
    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw if IP in request does not match', async () => {
    dnsService.getServerIpAddresses.mockResolvedValue(['5.6.7.8']);
    const context = mockContext(
      {
        'x-bananatransfer-domain': 'example.com',
      },
      '4.5.6.7',
    );
    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw if DNS service throws', async () => {
    dnsService.getServerIpAddresses.mockRejectedValue(new Error('DNS error'));
    const context = mockContext({
      'x-bananatransfer-domain': 'example.com',
      'x-forwarded-for': '1.2.3.4',
    });
    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
