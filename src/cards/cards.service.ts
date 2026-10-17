import { Injectable } from '@nestjs/common';
import { JsonStoreService } from '../common/json-store.service';
import { CardRecord, HistoryFile } from '../common/types';

@Injectable()
export class CardsService {
  constructor(private readonly store: JsonStoreService) {}

  getApprovedCards() {
    const cards = this.store.readCards();
    return {
      count: cards.length,
      data: cards.map(({ id, name, issuer, productUrl, approved, lastVerifiedAt }) => ({
        id,
        name,
        issuer,
        productUrl,
        approved,
        lastVerifiedAt,
      })),
    };
  }

  getHistory(id: string) {
    const card = this.store.readCards().find((item) => item.id === id);
    if (!card) return null;

    const historyFile: HistoryFile = this.store.readHistory();
    const entries = historyFile.records.filter((record) => record.cardId === id);
    return {
      cardId: card.id,
      cardName: card.name,
      count: entries.length,
      history: entries.sort(
        (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime(),
      ),
    };
  }
}
