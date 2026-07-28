import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { SupabaseStorageClient } from './supabase-storage.client';

@Module({
  providers: [SupabaseStorageClient, MediaService],
  exports: [MediaService],
})
export class MediaModule {}
