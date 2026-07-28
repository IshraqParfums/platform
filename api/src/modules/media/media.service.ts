import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_MEDIA_BUCKET } from './media.constants';
import { SupabaseStorageClient } from './supabase-storage.client';

export interface UploadedProductImage {
  url: string;
  storagePath: string;
}

const EXT_BY_MIME: Record<string, string> = {
  'image/png': '.png',
  'image/webp': '.webp',
  'image/jpeg': '.jpg',
};

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly bucket: string;

  constructor(
    private readonly storageClient: SupabaseStorageClient,
    configService: ConfigService,
  ) {
    this.bucket =
      configService.get<string>('SUPABASE_STORAGE_BUCKET') ??
      DEFAULT_MEDIA_BUCKET;
  }

  async uploadProductImage(
    productId: string,
    file: Express.Multer.File,
  ): Promise<UploadedProductImage> {
    const ext = extname(file.originalname) || EXT_BY_MIME[file.mimetype] || '';
    const storagePath = `${productId}/${randomUUID()}${ext}`;

    const { error } = await this.storageClient.storage
      .from(this.bucket)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new BadRequestException(`Failed to upload image: ${error.message}`);
    }

    const {
      data: { publicUrl },
    } = this.storageClient.storage.from(this.bucket).getPublicUrl(storagePath);

    return { url: publicUrl, storagePath };
  }

  /** Best-effort — logs and swallows failures so cleanup never blocks the primary DB operation. */
  async remove(storagePath: string | null | undefined): Promise<void> {
    if (!storagePath) {
      return;
    }

    const { error } = await this.storageClient.storage
      .from(this.bucket)
      .remove([storagePath]);

    if (error) {
      this.logger.warn(
        `Failed to remove storage object "${storagePath}": ${error.message}`,
      );
    }
  }
}
