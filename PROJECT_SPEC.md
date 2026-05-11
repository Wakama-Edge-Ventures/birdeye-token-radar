# PROJECT_SPEC.md — Birdeye Token Radar

> **CONTEXT**: This is a bounty submission for the Birdeye Data 4-Week BIP Competition (Sprint 4) on Superteam Earn.
> Prize: $500 USDC + $1,000 API credits.
> Deadline: May 16, 2026.
> Judging: Community Support (X engagement) + Product Utility + Technical Depth + Presentation.
> Requirement: minimum 50 Birdeye API calls.

---

## 1. PRODUCT OVERVIEW

**Birdeye Token Radar** — A real-time dashboard that surfaces newly listed Solana tokens, scores their safety, and helps traders quickly identify promising vs. dangerous tokens.

**Target user**: Solana traders who want to discover new tokens early without getting rugged.

**Core value prop**: "New token radar with safety scoring" — pull fresh listings, filter through security checks, surface only the ones worth watching.

---

## 2. TECH STACK

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts (already available in Next.js ecosystem)
- **API**: Birdeye Data API (key stored in `.env.local` as `BIRDEYE_API_KEY`)
- **Deployment**: Vercel (free tier)
- **No database needed** — all data is fetched live from Birdeye API

---

## 3. BIRDEYE API ENDPOINTS TO USE

All API calls go through `https://public-api.birdeye.so` with header:
```
X-API-KEY: process.env.BIRDEYE_API_KEY
```

### Primary Endpoints:

1. **GET /defi/token_trending** — Get trending tokens on Solana
   - Query params: `sort_by=rank&sort_type=asc&offset=0&limit=20`
   - Returns: list of trending tokens with address, symbol, name, price, volume, price change

2. **GET /defi/token_security** — Get security info for a token
   - Query params: `address={token_address}`
   - Returns: security data (is_mutable, is_mintable, top10_holder_percent, creator_address, etc.)

3. **GET /v2/tokens/new_listing** — Get newly listed tokens
   - Query params: `chain=solana&limit=20`
   - Returns: new tokens with address, symbol, name, listing time

4. **GET /defi/token_overview** — Get token details (price, volume, market cap)
   - Query params: `address={token_address}`
   - Returns: price, volume24h, marketCap, holder count, etc.

5. **GET /defi/price_history** — Get price history for mini-charts
   - Query params: `address={token_address}&address_type=token&type=1H`
   - Returns: price points over time

### API Route Architecture (Next.js API Routes to proxy calls):

```
app/api/tokens/trending/route.ts    → calls /defi/token_trending
app/api/tokens/new/route.ts         → calls /v2/tokens/new_listing
app/api/tokens/security/route.ts    → calls /defi/token_security?address=X
app/api/tokens/overview/route.ts    → calls /defi/token_overview?address=X
app/api/tokens/price/route.ts       → calls /defi/price_history?address=X
```

**IMPORTANT**: All Birdeye API calls MUST go through Next.js API routes (server-side) to keep the API key hidden. The frontend calls `/api/tokens/...`, not the Birdeye API directly.

---

## 4. PAGES & FEATURES

### Page 1: Dashboard (`/`) — Main Token Radar

**Layout**: Full-width dark theme dashboard with sidebar nav.

**Sections**:

#### A. Header Bar
- Logo "Token Radar" + "Powered by Birdeye Data" badge
- Chain indicator: "Solana" (hardcoded for now)
- Auto-refresh toggle (every 30s) + last refreshed timestamp
- Total tokens scanned counter (cumulative API calls indicator)

#### B. Trending Tokens Table (top section)
- Fetches `/defi/token_trending` on page load
- Table columns: Rank | Token (icon + name + symbol) | Price | 24h Change (% with color green/red) | Volume 24h | Safety Score (computed) | Action (link to Birdeye)
- Each row: on load, automatically calls `/defi/token_security` for that token to compute a Safety Score
- Clickable rows → expand to show detail panel

#### C. New Listings Feed (bottom section)
- Fetches `/v2/tokens/new_listing` on page load
- Card grid layout (4 columns on desktop, 2 mobile)
- Each card: Token name + symbol | Listed time (relative "2h ago") | Safety Score badge (🟢 Safe / 🟡 Caution / 🔴 Danger) | Price if available | Link to Birdeye
- Auto-fetches security data for each new listing

#### D. Safety Score Logic

Compute a 0-100 safety score based on `/defi/token_security` response:

```typescript
function computeSafetyScore(security: TokenSecurity): number {
  let score = 100;

  // Mutable metadata = risky (can change token info)
  if (security.isMutable) score -= 20;

  // Mintable = can inflate supply
  if (security.isMintable) score -= 25;

  // Top 10 holders own > 50% = concentration risk
  if (security.top10HolderPercent > 50) score -= 20;
  else if (security.top10HolderPercent > 30) score -= 10;

  // Freezable = can freeze your tokens
  if (security.isFreezable) score -= 15;

  // No creator info = suspicious
  if (!security.creatorAddress) score -= 10;

  return Math.max(0, score);
}

// Badge mapping:
// 80-100 = 🟢 Safe
// 50-79  = 🟡 Caution
// 0-49   = 🔴 Danger
```

### Page 2: Token Detail (`/token/[address]`) — Deep Dive

- Fetches `/defi/token_overview` + `/defi/token_security` + `/defi/price_history`
- Shows: full security breakdown, price chart (Recharts line chart), holder stats, links
- Safety score with detailed breakdown (each factor explained)

---

## 5. DESIGN DIRECTION

**Aesthetic**: Dark, data-rich, crypto-native. Think "Bloomberg Terminal meets DeFi". NOT generic purple gradients.

**Color palette**:
- Background: `#0a0e17` (deep navy/black)
- Cards: `#111827` with `#1f2937` borders
- Primary accent: `#06d6a0` (mint green — Birdeye's brand color)
- Danger: `#ef4444`
- Warning: `#f59e0b`
- Text: `#f9fafb` (primary), `#9ca3af` (secondary)

**Typography**:
- Headers: JetBrains Mono (monospace, crypto-native feel)
- Body: DM Sans (clean, readable)
- Load via Google Fonts in `layout.tsx`

**Key UI details**:
- Subtle glow effect on the Safety Score badges
- Animated number counters for price changes
- Skeleton loaders while fetching data (not blank screens)
- Responsive: works on mobile (single column) and desktop (multi-column)
- Pulse animation on "Live" indicator when auto-refresh is on

---

## 6. FILE STRUCTURE

```
birdeye-token-radar/
├── app/
│   ├── layout.tsx              # Root layout with fonts + metadata
│   ├── page.tsx                # Main dashboard page
│   ├── token/
│   │   └── [address]/
│   │       └── page.tsx        # Token detail page
│   ├── api/
│   │   └── tokens/
│   │       ├── trending/
│   │       │   └── route.ts    # Proxy → Birdeye trending
│   │       ├── new/
│   │       │   └── route.ts    # Proxy → Birdeye new listings
│   │       ├── security/
│   │       │   └── route.ts    # Proxy → Birdeye token security
│   │       ├── overview/
│   │       │   └── route.ts    # Proxy → Birdeye token overview
│   │       └── price/
│   │           └── route.ts    # Proxy → Birdeye price history
│   └── globals.css             # Tailwind + custom CSS
├── components/
│   ├── Header.tsx              # Top navigation bar
│   ├── TrendingTable.tsx       # Trending tokens table
│   ├── NewListingsFeed.tsx     # New listings card grid
│   ├── SafetyBadge.tsx         # Safety score badge component
│   ├── TokenDetailPanel.tsx    # Expandable detail panel
│   ├── PriceChart.tsx          # Recharts mini line chart
│   ├── SkeletonLoader.tsx      # Loading skeleton
│   └── ApiCallCounter.tsx      # Shows total API calls made
├── lib/
│   ├── birdeye.ts              # Birdeye API client (server-side)
│   ├── safety-score.ts         # Safety score computation logic
│   └── types.ts                # TypeScript interfaces
├── .env.local                  # BIRDEYE_API_KEY=xxx (gitignored)
├── .gitignore
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 7. README.md CONTENT

The README should include:
- Project name + description
- Screenshot (add after build)
- "Built with Birdeye Data API" badge/mention
- Endpoints used (list all 5)
- How to run locally (clone, env, npm run dev)
- Live demo link (Vercel URL)
- Built for Birdeye Data BIP Competition Sprint 4
- Author: Marouane Jebbar — @johncena on X

---

## 8. DEPLOYMENT

Deploy to Vercel:
```bash
npm i -g vercel
vercel
```
- Set environment variable `BIRDEYE_API_KEY` in Vercel dashboard
- The live URL becomes the submission link

---

## 9. POST-BUILD CHECKLIST

Before submitting:

- [ ] Dashboard loads with real data from Birdeye API
- [ ] Safety scores display correctly (green/yellow/red)
- [ ] Token detail page works when clicking a token
- [ ] Auto-refresh works (30s interval)
- [ ] API call counter shows 50+ calls
- [ ] Mobile responsive
- [ ] Deployed on Vercel with live URL
- [ ] GitHub repo is public
- [ ] README is complete with screenshots
- [ ] X post published with #BirdeyeAPI + @birdeye_data
- [ ] Submission form on Superteam Earn filled

---

## 10. EXECUTION ORDER FOR CLAUDE CODE

If using Claude Code or Cline, execute in this order:

1. First: Create `lib/types.ts` (all TypeScript interfaces)
2. Then: Create `lib/birdeye.ts` (API client with all 5 endpoint functions)
3. Then: Create `lib/safety-score.ts` (score computation)
4. Then: Create all 5 API routes in `app/api/tokens/`
5. Then: Create components one by one (SafetyBadge → SkeletonLoader → Header → TrendingTable → NewListingsFeed → PriceChart → ApiCallCounter)
6. Then: Build `app/page.tsx` (main dashboard assembling components)
7. Then: Build `app/token/[address]/page.tsx` (detail page)
8. Then: Update `app/layout.tsx` (fonts, metadata, dark theme)
9. Then: Update `app/globals.css` (custom styles)
10. Finally: Update `README.md`
