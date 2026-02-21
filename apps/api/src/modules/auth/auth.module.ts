import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PocketBaseSyncService } from './pocketbase-sync.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PocketBaseSyncService],
})
export class AuthModule {}
