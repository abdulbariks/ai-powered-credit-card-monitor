import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JsonStoreService } from '../common/json-store.service';
import { RagRetrieverService } from './rag-retriever.service';
import { AiExtractionService } from './ai-extraction.service';

@Module({
  imports: [ConfigModule],
  providers: [JsonStoreService, RagRetrieverService, AiExtractionService],
  exports: [RagRetrieverService, AiExtractionService],
})
export class RagModule {}
