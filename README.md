# FlickPredictions

A web-based prediction markets platform where users swipe or click to bet on real-world events. No crypto wallet needed - login with email or social accounts.

---

## Features

- **No Wallet Required**: Login with email, Google, or Twitter - we create a wallet for you
- **Intuitive Interface**: Swipe or click to bet on prediction markets
- **Embedded Wallets**: Privy automatically creates and manages your Solana wallet
- **Real-Time Data**: Live market probabilities and volumes from Kalshi
- **Social Sharing**: Share markets on X (Twitter) and Facebook
- **Easy Funding**: Buy crypto directly with credit card (MoonPay integration)

---

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Privy Account - Sign up at privy.io

### Installation

```bash
npm install

cp .env.example .env
# Edit .env with your Privy API keys and database URL

npm run db:push

npm run dev:client  # Frontend at http://localhost:3000
npm run dev         # Backend at http://localhost:5000
```

Open http://localhost:3000 in your browser.

---

## How to Use

### For Users:
1. **Login**: Click "Login" and choose email, Google, or Twitter
2. **Automatic Wallet**: Privy creates a Solana wallet for you automatically
3. **Browse Markets**: Use swipe gestures or buttons:
   - Right Swipe or checkmark button: Bet YES
   - Left Swipe or X button: Bet NO
   - Down Swipe or SKIP button: Skip to next
4. **Fund Wallet**: Click "Fund Wallet" to buy crypto with credit card
5. **Track Activity**: View your trades in the Activity tab

### For Advanced Users:
- Connect external wallets (Phantom, Solflare, Backpack)
- Export your private key from Privy if you want full custody

---

## Project Structure

```
FlickPredictions/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Route pages
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities
├── server/              # Express backend
│   ├── routes.ts        # API endpoints
│   ├── pond.ts          # Market data service
│   ├── storage.ts       # Database layer
│   └── index.ts         # Server entry
├── shared/              # Shared types and schemas
├── db/                  # Database config
└── script/              # Build scripts
```

---

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite for fast development
- Privy for authentication and embedded wallets
- Tailwind CSS for styling
- Framer Motion for animations
- TanStack Query for data fetching

### Backend
- Express.js with TypeScript
- PostgreSQL with Drizzle ORM
- Privy Server SDK for user authentication
- Kalshi API for market data
- DFlow Pond API for Solana trading

---

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Privy Authentication (Required)
# Get these from https://dashboard.privy.io
VITE_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret

# Database (Required)
DATABASE_URL=postgresql://user:password@localhost:5432/flick_predictions

# Server
PORT=5000
NODE_ENV=development

# Optional: Helius RPC (for better performance)
VITE_HELIUS_API_KEY=your_helius_key
HELIUS_API_KEY=your_helius_key

# Optional: DFlow API (for production trading)
DFLOW_API_KEY=your_dflow_key
```

### Privy Setup

1. Go to dashboard.privy.io
2. Create a new app
3. Enable login methods: Email, Google, Twitter
4. Enable embedded wallets for Solana
5. Copy your App ID and App Secret to `.env`

### Database Setup

#### Local PostgreSQL
```bash
createdb flick_predictions
```

#### Supabase (Free Cloud Option)
1. Create project at supabase.com
2. Get connection string from Project Settings > Database
3. Add to `.env`

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:client` | Start frontend dev server (port 3000) |
| `npm run dev` | Start backend dev server (port 5000) |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Apply database migrations |

---

## Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Setup

1. Set up Privy production app
2. Configure production DATABASE_URL
3. Add HELIUS_API_KEY for better RPC
4. Add DFLOW_API_KEY for trading
5. Set NODE_ENV=production

### Recommended Hosting

- Railway - Full-stack with database
- Render - Free tier available
- Vercel + Railway - Frontend on Vercel, backend on Railway

---

## Security

- Embedded Wallets: Privy manages wallets securely with encrypted key management
- No Private Keys Stored: Keys are encrypted and only accessible by the user
- OAuth Security: Google/Twitter login uses industry-standard OAuth 2.0
- Transaction Approval: All transactions require explicit user approval
- Self-Custody Option: Users can export private keys anytime

---

## Troubleshooting

### Privy App ID not found
- Make sure VITE_PRIVY_APP_ID is in .env
- Restart dev server after changing .env

### Login Not Working
- Check Privy dashboard at dashboard.privy.io
- Verify login methods are enabled (Email, Google, Twitter)
- Check browser console for errors

### Wallet Not Created
- Ensure embedded wallets are enabled in Privy dashboard
- Check Solana is selected as a supported chain
- Try logging out and back in

### Markets Not Loading
- Verify backend is running with npm run dev
- Check database connection
- Look for errors in backend terminal

### Build Errors
```bash
rm -rf node_modules package-lock.json
npm install
npm run check
```

---

## API Endpoints

### Markets
- GET /api/markets - Paginated markets
- GET /api/markets/search - Search markets
- GET /api/events/:ticker/markets - Markets by event

### Trading
- POST /api/pond/quote - Get trade quote
- POST /api/pond/order - Execute trade
- POST /api/pond/sell - Sell position
- POST /api/pond/redeem - Redeem winnings

### User
- POST /api/users - Create/get user
- GET /api/users/me - Current user profile
- GET /api/trades - Trade history
- GET /api/positions - Open positions

---

## License

MIT License
