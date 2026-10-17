export type VerificationStatus =
  | 'unchanged'
  | 'pending_review'
  | 'manual_review'
  | 'approved';

export interface CardTerms {
  purchaseApr: string | null;
  balanceTransferApr: string | null;
  annualFee: string | null;
  welcomeBonus: string | null;
  rewards: string | null;
  introAprDuration: string | null;
  conditions: string[];
}

export interface CardRecord {
  id: string;
  name: string;
  issuer: string;
  productUrl: string;
  approved: boolean;
  lastVerifiedAt: string;
  terms: CardTerms;
}

export interface SourceDocument {
  id: string;
  cardId: string;
  issuer: string;
  url: string;
  title: string;
  content: string;
  capturedAt: string;
}

export interface HistoryRecord {
  id: string;
  cardId: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  detectedAt: string;
  sourceUrl: string;
  evidence: string[];
  verificationStatus: VerificationStatus;
  verificationNote: string;
}

export interface HistoryFile {
  records: HistoryRecord[];
}

export interface ExtractedCardTerms {
  purchaseApr: string | null;
  balanceTransferApr: string | null;
  annualFee: string | null;
  welcomeBonus: string | null;
  rewards: string | null;
  introAprDuration: string | null;
  conditions: string[];
  evidence: Record<string, string>;
  sourceUrl: string;
}
