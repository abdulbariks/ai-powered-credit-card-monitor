import { Injectable } from '@nestjs/common';
import { JsonStoreService } from '../common/json-store.service';
import { CardRecord, SourceDocument } from '../common/types';

export interface RetrievedContext {
  documents: SourceDocument[];
  evidenceText: string;
}

@Injectable()
export class RagRetrieverService {
  constructor(private readonly store: JsonStoreService) {}

  retrieve(card: CardRecord, topK = 3): RetrievedContext {
    const docs = this.store.readSources().filter(
      (doc) => doc.cardId === card.id || doc.issuer.toLowerCase() === card.issuer.toLowerCase(),
    );

    const query = `${card.name} ${card.issuer} purchase APR balance transfer APR annual fee welcome bonus rewards introductory conditions`;
    const queryTokens = this.tokens(query);

    const ranked = docs
      .map((doc) => {
        const contentTokens = this.tokens(`${doc.title} ${doc.content}`);
        const overlap = [...queryTokens].filter((token) => contentTokens.has(token)).length;
        const cardMatch = doc.cardId === card.id ? 5 : 0;
        return { doc, score: overlap + cardMatch };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((entry) => entry.doc);

    return {
      documents: ranked,
      evidenceText: ranked
        .map((doc, index) => [
          `SOURCE ${index + 1}`,
          `Title: ${doc.title}`,
          `URL: ${doc.url}`,
          `Captured at: ${doc.capturedAt}`,
          `Content: ${doc.content}`,
        ].join('\n'))
        .join('\n\n---\n\n'),
    };
  }

  private tokens(value: string): Set<string> {
    return new Set(
      value.toLowerCase().match(/[a-z0-9$%.-]+/g)?.filter((token) => token.length > 1) ?? [],
    );
  }
}
