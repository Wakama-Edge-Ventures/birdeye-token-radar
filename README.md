# Birdeye Token Radar

Birdeye Token Radar is a real-time Solana dashboard that surfaces trending tokens, fresh listings, and a simplified overview-based safety score so traders can quickly separate stronger launches from fragile ones.

Built with Birdeye Data API.

## Screenshot

Add a dashboard screenshot here after the first Vercel deployment capture.

## What It Does

- Tracks Birdeye trending Solana tokens in a live data table.
- Surfaces newly listed Solana tokens in a fast-scanning card feed.
- Computes a 0-100 safety score from free-plan `token_overview` metrics.
- Opens a token detail page with charting, fundamentals, and risk breakdown.
- Keeps all Birdeye requests server-side through Next.js API routes.

## Endpoints Used

- `GET /defi/token_trending`
- `GET /defi/v2/tokens/new_listing`
- `GET /defi/token_overview`
- `GET /defi/history_price`

## Simplified Risk Score

The current dashboard uses overview data available on the Birdeye free plan.

- Holder count: under `100` is dangerous, `100-1000` is caution, above `1000` is safer.
- Liquidity: under `$10K` is dangerous, `$10K-$100K` is caution, above `$100K` is safer.
- Volume 24h: under `$5K` is dangerous, `$5K-$50K` is caution, above `$50K` is safer.
- Market cap: under `$50K` is dangerous, `$50K-$500K` is caution, above `$500K` is safer.

## Local Development

1. Clone the repo.
2. Install dependencies:

```bash
npm install
```

3. Create `.env.local` and add:

```bash
BIRDEYE_API_KEY=your_key_here
```

4. Start the dev server:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## App Routes

- `/` - Main Token Radar dashboard
- `/token/[address]` - Token detail deep dive
- `/api/tokens/trending` - Server proxy for trending tokens
- `/api/tokens/new` - Server proxy for new listings
- `/api/tokens/security` - Server-side risk-score payload backed by `token_overview`
- `/api/tokens/overview` - Server proxy for token overview
- `/api/tokens/price` - Server proxy for price history

## Live Demo

Add your Vercel deployment URL here after deploying.

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Set `BIRDEYE_API_KEY` in the Vercel project environment variables before production testing.

## Competition

Built for Birdeye Data BIP Competition Sprint 4 on Superteam Earn.

## Author

Marouane Jebbar - [@johncena on X](https://x.com/johncena)
