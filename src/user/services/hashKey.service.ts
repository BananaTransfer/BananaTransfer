import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

import { PublicKeyDto } from '@user/dto/publicKey.dto';

@Injectable()
export class HashKeyService {
  constructor() {}

  public hashKey(dto: PublicKeyDto): string {
    const hash = crypto.createHash('sha256');
    hash.update(dto.publicKey);
    return hash.digest('hex');
  }
}
