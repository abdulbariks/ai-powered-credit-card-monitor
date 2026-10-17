# AI-Powered Credit Card Data Monitoring System

A demo implementation of the supplied assignment using **NestJS**, **TypeScript**, **JSON files instead of a database**, and a small **RAG (Retrieval-Augmented Generation)** pipeline.

## What is included

- Only two HTTP endpoints:
  - `GET /api/cards` — latest approved card information.
  - `GET /api/cards/:id/history` — detected changes and their verification status.
- Demo card records and source evidence in `data/cards.json`, `data/card-history.json`, and `data/source-documents.json`.
- RAG retrieval: relevant issuer source snippets are retrieved from local source-document fixtures before they are sent to the AI model.
- AI extraction/verification through an OpenAI-compatible Chat Completions API when `AI_API_KEY` is configured.
- Safe demo fallback when no API key is configured; it does not invent new financial values.
- A 24-hour scheduled monitoring job plus `npm run monitor:once` for a one-off run.
- JSON-file persistence, no database.
- Source URL, evidence snippets, timestamps, status tracking, and historical change records.

> **Important:** All card and issuer examples in this repository are fictional demo data. Do not use this demo as a source of real financial information. For production, use verified official issuer pages and permitted access methods, improve source provenance, add robust tests/monitoring, and require human approval for uncertain changes.

## Requirements

- Node.js 20+
- npm

## Setup

```bash
npm install
cp example.env .env
npm run start:dev
```

The API runs at `http://localhost:3000`.

To enable AI extraction, obtain an API key from the provider configured by `AI_BASE_URL` and add it to `.env` (the project cannot generate provider credentials):

```env
AI_API_KEY=your_actual_api_key
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

Never commit `.env` or real API keys. `example.env` is a template only.

## Endpoints

### 1. Latest approved cards

```bash
curl http://localhost:3000/api/cards
```

Returns the latest approved card information. Unapproved observations are not exposed as current approved values.

### 2. Card change history

```bash
curl http://localhost:3000/api/cards/card_001/history
```

Returns the change records and verification status for the requested card ID. An unknown ID returns `404`.

These are the only HTTP routes exposed by the application.

## RAG workflow

1. The monitor loads each card from `data/cards.json`.
2. It searches `data/source-documents.json` for relevant issuer text using token overlap.
3. The retrieved source snippets and source URLs are passed as context to the AI model.
4. The model is instructed to extract only values supported by that context and return JSON.
5. The verifier checks that important values are supported by retrieved evidence. AI agreement by itself is not treated as proof.
6. Unchanged values are logged as unchanged. Changes with sufficient evidence are recorded as `pending_review`; they do not automatically replace approved card data. Conflicting or unsupported results are marked `manual_review`.
7. JSON files are updated atomically through temporary-file rename.

The included retrieval is a lightweight local RAG baseline, not a vector database. It is suitable for demonstrating the architecture; a production implementation may use embeddings and a vector store.

## Run a one-time monitoring pass

```bash
npm run monitor:once
```

The app also runs the monitor every `MONITOR_INTERVAL_HOURS` hours (default 24) after the NestJS process starts.

The demo source documents are static fixtures. To demonstrate a detected change, edit a relevant document in `data/source-documents.json`, then run `npm run monitor:once`. New financial values remain pending/manual review instead of being silently published.

## Data files

- `data/cards.json`: current approved card records and their source metadata.
- `data/source-documents.json`: local issuer-page fixtures used by RAG.
- `data/card-history.json`: detected changes and verification status.

Because JSON files are not a database, this demo is intended for a single process and small sample data. Multiple instances can overwrite each other's writes. Use file locking or a database for production workloads.

## Architecture

```text
Event / manual one-off run
          |
          v
NestJS MonitoringService
          |
          +--> JSON cards
          |
          +--> RAG Retriever --> issuer source fixtures
          |                         |
          +-------------------------+
                    |
                    v
          AI extraction (optional API)
                    |
                    v
          Evidence / value validation
                    |
          +---------+----------+
          |                    |
          v                    v
  Change history JSON   Approved cards JSON
          |
          v
 GET /api/cards/:id/history

 GET /api/cards --> latest approved card JSON
```

## Cost and reliability notes

- Without `AI_API_KEY`, no AI API cost is incurred; deterministic demo checks run instead.
- With AI enabled, costs depend on model pricing, prompt size, source length, and number of cards checked.
- The monitor limits concurrency and handles per-card errors so one failed card does not stop the entire run.
- This sample does not bypass website protections. It uses local fixture content; add only authorized official-source retrieval in a real deployment.
