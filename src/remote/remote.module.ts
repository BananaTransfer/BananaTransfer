import { Module } from '@nestjs/common';
import { TransferModule } from '@transfer/transfer.module';
import { UserModule } from '@user/user.module';
import { RemoteController } from '@remote/controllers/remote.controller';
import { DnsService } from '@remote/services/dns.service';

@Module({
  imports: [TransferModule, UserModule],
  controllers: [RemoteController],
  providers: [DnsService],
})
export class RemoteModule {}
