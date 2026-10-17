import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CardsModule } from '../cards/cards.module';
import { JsonStoreService } from '../common/json-store.service';
import { RagModule } from '../rag/rag.module';
import { MonitoringService } from './monitoring.service';

@Module({
  imports: [ConfigModule, CardsModule, RagModule],
  providers: [JsonStoreService, MonitoringService],
})
export class MonitoringModule {}
