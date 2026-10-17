import { Module } from '@nestjs/common';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { JsonStoreService } from '../common/json-store.service';

@Module({
  controllers: [CardsController],
  providers: [CardsService, JsonStoreService],
  exports: [CardsService],
})
export class CardsModule {}
