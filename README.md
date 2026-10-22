# MiniLedger

Track money you've lent to friends.

- **backend/** — Node.js + TypeScript + Express 5 + PostgreSQL
- **mobile/** — React Native (Expo SDK 58, Expo Router) + TanStack Query + NativeWind (Tailwind)

## Quick start

Requirements: Node 20+, Docker (for PostgreSQL), and either the Expo Go app on your phone or an Android/iOS emulator.

```bash
# 1. Database
docker compose up -d

# 2. API (http://localhost:4000)
cd backend
cp .env.example .env        # set JWT_SECRET to a long random string
npm install
npm run dev                 # creates the tables on start; OTP codes are printed here

# 3. App
cd ../mobile
npm install
npx expo start              # scan the QR code with Expo Go, or press a / i / w
```

**Signing in:** enter a 10-digit phone number, then read the 6-digit code from the backend terminal (`[OTP] Login code for 9876543210: 123456`). No SMS is sent.

**Reaching the API from a phone:** the app automatically uses the IP of the machine running `expo start`, on port 4000, so a phone on the same Wi-Fi works with no config. To point elsewhere, set `EXPO_PUBLIC_API_URL` in `mobile/.env` (see `.env.example`). Allow port 4000 through your firewall if the phone can't connect.

## API

All `/api/loans` routes need `Authorization: Bearer <token>`.

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/auth/otp/request` | `{ phone }` (10 digits) → generates an OTP (valid 5 min), logs it to the console |
| POST | `/api/auth/otp/verify` | `{ phone, code }` → `{ token, user }` (5 wrong attempts invalidates the code) |
| GET | `/api/auth/me` | Current user |
| GET | `/api/loans?status=all\|pending\|overdue\|repaid` | List loans (unpaid first, by due date) |
| POST | `/api/loans` | JSON or multipart: `friendName`, `amount`, `dueDate` (YYYY-MM-DD), `note?`, `receipt?` (image ≤ 5 MB) |
| PATCH | `/api/loans/:id/repay` | Mark repaid (409 if already repaid) |
| DELETE | `/api/loans/:id` | Delete a loan and its receipt |
| GET | `/api/loans/:id/receipt` | The receipt image (owner only) |
| GET | `/api/loans/summary` | `totalLent`, `totalRepaid`, `outstanding`, `overdueAmount`, and counts |

A loan is **overdue** when it is unpaid and its due date is before today. Amounts are stored as integer cents.

## Tests

```bash
cd backend
npm test          # Vitest + Supertest against an in-memory Postgres (pg-mem), no DB needed
npm run typecheck

cd ../mobile
npm run typecheck
npx expo lint
```

## Project layout

```
backend/src
  app.ts                  createApp(deps): wires services/routes; db, clock and OTP sender are injectable
  modules/auth            schema (zod) → service → routes
  modules/loans           schema (zod) → service (SQL + DTO mapping) → routes
  middleware/             auth (JWT), multer image upload, error handler
  lib/                    HttpError, parse() validation helper, clock, money
mobile/src
  app/                    Expo Router screens; (app)/ is guarded by Stack.Protected
  api/                    typed API calls
  hooks/                  TanStack Query hooks (use-loans, use-auth) and a reusable useForm
  components/ui/          Button, TextField, Card, Badge, SegmentedControl, states, FormScreen
  components/loans/       SummaryCard, LoanCard, LoanForm, DueDateField, ReceiptPicker, ReceiptImage
  providers/              QueryProvider, SessionProvider (token in SecureStore)
```
