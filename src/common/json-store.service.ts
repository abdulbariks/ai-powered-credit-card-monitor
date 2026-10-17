import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { CardRecord, HistoryFile, SourceDocument } from './types';

@Injectable()
export class JsonStoreService {
  private readonly logger = new Logger(JsonStoreService.name);
  private readonly dataDir = path.resolve(process.cwd(), 'data');

  private file(name: string) {
    return path.join(this.dataDir, name);
  }

  private readJson<T>(name: string, fallback: T): T {
    try {
      return JSON.parse(fs.readFileSync(this.file(name), 'utf8')) as T;
    } catch (error) {
      this.logger.error(`Could not read ${name}: ${(error as Error).message}`);
      return fallback;
    }
  }

  private writeJsonAtomic(name: string, value: unknown): void {
    fs.mkdirSync(this.dataDir, { recursive: true });
    const destination = this.file(name);
    const temp = `${destination}.tmp`;
    fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    fs.renameSync(temp, destination);
  }

  readCards(): CardRecord[] {
    return this.readJson<CardRecord[]>('cards.json', []);
  }

  writeCards(cards: CardRecord[]): void {
    this.writeJsonAtomic('cards.json', cards);
  }

  readSources(): SourceDocument[] {
    return this.readJson<SourceDocument[]>('source-documents.json', []);
  }

  readHistory(): HistoryFile {
    return this.readJson<HistoryFile>('card-history.json', { records: [] });
  }

  writeHistory(history: HistoryFile): void {
    this.writeJsonAtomic('card-history.json', history);
  }
}
