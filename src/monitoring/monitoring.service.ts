import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { JsonStoreService } from '../common/json-store.service';
import { CardRecord, ExtractedCardTerms, HistoryRecord } from '../common/types';
import { AiExtractionService } from '../rag/ai-extraction.service';
import { RagRetrieverService } from '../rag/rag-retriever.service';

const MONITORED_FIELDS: Array<keyof Pick<
  ExtractedCardTerms,
  'purchaseApr' | 'balanceTransferApr' | 'annualFee' | 'welcomeBonus' | 'rewards' | 'introAprDuration'
>> = [
  'purchaseApr',
  'balanceTransferApr',
  'annualFee',
  'welcomeBonus',
  'rewards',
  'introAprDuration',
];

@Injectable()
export class MonitoringService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(MonitoringService.name);
  private running = false;
  private intervalHandle: NodeJS.Timeout | undefined;

  constructor(
    private readonly store: JsonStoreService,
    private readonly retriever: RagRetrieverService,
    private readonly extractor: AiExtractionService,
    private readonly config: ConfigService,
  ) {}

  onApplicationBootstrap() {
    const hours = Math.max(1, Number(this.config.get('MONITOR_INTERVAL_HOURS') || 24));
    const intervalMs = hours * 60 * 60 * 1000;
    this.logger.log(`Monitoring scheduler enabled; running every ${hours} hour(s).`);
    this.intervalHandle = setInterval(() => {
      void this.runMonitoring();
    }, intervalMs);
  }

  onModuleDestroy() {
    if (this.intervalHandle) clearInterval(this.intervalHandle);
  }

  async runMonitoring() {
    if (this.running) {
      this.logger.warn('Monitoring run skipped because another run is in progress.');
      return;
    }

    this.running = true;
    const startedAt = Date.now();
    try {
      const cards = this.store.readCards();
      this.logger.log(`Starting monitoring run for ${cards.length} demo cards.`);
      // Sequential processing keeps the demo gentle on sources and avoids concurrent JSON writes.
      for (const card of cards) {
        try {
          await this.processCard(card);
        } catch (error) {
          this.logger.error(`Card ${card.id} failed: ${(error as Error).message}`);
        }
      }
      this.logger.log(`Monitoring run finished in ${Date.now() - startedAt}ms.`);
    } finally {
      this.running = false;
    }
  }

  private async processCard(card: CardRecord) {
    const context = this.retriever.retrieve(card);
    if (context.documents.length === 0) {
      this.appendHistory({
        id: randomUUID(),
        cardId: card.id,
        field: '_source',
        oldValue: null,
        newValue: null,
        detectedAt: new Date().toISOString(),
        sourceUrl: card.productUrl,
        evidence: [],
        verificationStatus: 'manual_review',
        verificationNote: 'No matching source document was retrieved; no financial values were changed.',
      });
      return;
    }

    const extracted = await this.extractor.extract(card, context);
    const nextTerms = extracted;
    const cards = this.store.readCards();
    const current = cards.find((item) => item.id === card.id);
    if (!current) return;

    for (const field of MONITORED_FIELDS) {
      const oldValue = current.terms[field];
      const newValue = nextTerms[field];
      if (oldValue === newValue) {
        this.appendHistory({
          id: randomUUID(),
          cardId: card.id,
          field,
          oldValue,
          newValue,
          detectedAt: new Date().toISOString(),
          sourceUrl: extracted.sourceUrl,
          evidence: this.getEvidence(extracted, field),
          verificationStatus: 'unchanged',
          verificationNote: 'No change detected against the current approved value.',
        });
        continue;
      }

      const evidence = this.getEvidence(extracted, field);
      const supported = newValue !== null && evidence.length > 0 &&
        context.documents.some((doc) => doc.url === extracted.sourceUrl || doc.content.includes(evidence[0]));

      this.appendHistory({
        id: randomUUID(),
        cardId: card.id,
        field,
        oldValue,
        newValue,
        detectedAt: new Date().toISOString(),
        sourceUrl: extracted.sourceUrl,
        evidence,
        verificationStatus: supported ? 'pending_review' : 'manual_review',
        verificationNote: supported
          ? 'A change was detected with supporting source evidence. Human approval is required before publishing.'
          : 'A change was detected but sufficient source evidence could not be confirmed. No approved value was changed.',
      });
    }
  }

  private getEvidence(extracted: ExtractedCardTerms, field: string): string[] {
    const quote = extracted.evidence?.[field];
    return typeof quote === 'string' && quote.trim() ? [quote.trim()] : [];
  }

  private appendHistory(record: HistoryRecord) {
    const history = this.store.readHistory();
    history.records.push(record);
    this.store.writeHistory(history);
  }
}
