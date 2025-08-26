import { InternalServerErrorException } from '@nestjs/common';
import type { Mocked } from '@suites/doubles.jest';
import { TestBed } from '@suites/unit';
import { NOTFOUND, SERVFAIL, Resolver } from 'dns/promises';

import { DnsService, ProductionDnsService } from '@remote/services/dns.service';
import { InvalidDomainException } from '@remote/types/invalid-domain-exception.type';

describe('DnsService', () => {
  let authService: DnsService;
  let resolver: Mocked<Resolver>;

  beforeEach(async () => {
    const { unit, unitRef } =
      await TestBed.solitary(ProductionDnsService).compile();
    authService = unit;
    resolver = unitRef.get(Resolver);
  });

  describe('getServerAddress', () => {
    test.each(['.ch', '', 'localhost'])(
      'should throw if the provided domain is invalid (%s)',
      async (domain: string) => {
        await expect(authService.getServerAddress(domain)).rejects.toThrow(
          InvalidDomainException,
        );
      },
    );

    test('should throw if no _bananatransfer dns entry exist', async () => {
      resolver.resolveTxt.mockRejectedValue({ code: NOTFOUND });
      await expect(authService.getServerAddress('test.ch')).rejects.toThrow(
        InvalidDomainException,
      );
    });

    test('should throw if no there is a DNS resolution error', async () => {
      resolver.resolveTxt.mockRejectedValue({ code: SERVFAIL });
      await expect(authService.getServerAddress('test.ch')).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    test.each([
      [[['']]], // no valid DNS
      [[['.ch']]], // no valid DNS
      [[['test.ch', 'test.ch']]], // multiple value
      [[['test.ch'], ['test.ch']]], // multiple value
    ])(
      'should throw if the content of the DNS entry for _bananatransfer is invalid (%s)',
      async (content: string[][]) => {
        resolver.resolveTxt.mockResolvedValue(content);

        await expect(authService.getServerAddress('test.ch')).rejects.toThrow(
          InvalidDomainException,
        );
      },
    );

    test('should resolve correctly configured DNS server address', async () => {
      const expectedHostname = 'bananatransfer.test.ch';

      resolver.resolveTxt.mockResolvedValue([[expectedHostname]]);

      await expect(authService.getServerAddress('test.ch')).resolves.toEqual(
        expectedHostname,
      );
    });
  });
});
