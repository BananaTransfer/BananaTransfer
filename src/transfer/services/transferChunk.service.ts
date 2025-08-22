import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs/promises';

import { BucketService } from '@transfer/services/bucket.service';
import { ChunkDto } from '@transfer/dto/chunk.dto';

interface BucketChunkData {
  data: string;
  iv: string;
}

@Injectable()
export class TransferChunkService {
  private readonly logger = new Logger(TransferChunkService.name);

  constructor(private readonly bucketService: BucketService) {}
  /**
   * @param chunk
   * @return the size in bytes of the chunk payload
   */
  private getChunkSize(chunk: BucketChunkData): number {
    return new Blob([JSON.stringify(chunk)]).size;
  }

  async saveChunk(transferId: string, chunkData: ChunkDto) {
    const bucketData: BucketChunkData = {
      data: chunkData.encryptedData,
      iv: chunkData.iv,
    };
    await this.bucketService.putObject(
      transferId + '/' + chunkData.chunkIndex,
      Buffer.from(JSON.stringify(bucketData)),
    );
    return this.getChunkSize(bucketData);
  }

  async getChunk(
    transferId: string,
    chunkId: number,
  ): Promise<Omit<ChunkDto, 'isLastChunk'>> {
    const path = await this.bucketService.getFile(transferId + '/' + chunkId);

    try {
      const data = await fs.readFile(path, 'utf8');
      const bucketData = JSON.parse(data) as BucketChunkData;

      return {
        chunkIndex: Number(chunkId),
        encryptedData: bucketData.data,
        iv: bucketData.iv,
      };
    } finally {
      await fs.unlink(path);
    }
  }

  /**
   * Delete all chunks related to a transfer
   * @param transferId
   */
  async deleteTransferChunks(transferId: string): Promise<void> {
    this.logger.log(`Removing all chunks from transfer ${transferId}`);
    const files = await this.bucketService.listFiles(transferId);
    await Promise.all(files.map((f) => this.bucketService.deleteFile(f)));
    this.logger.debug('All chunks successfully deleted');
  }
}
