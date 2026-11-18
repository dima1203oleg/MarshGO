# Commercial Transport Providers & Payment Gateways

## 1. Overview & Capability Rules

Per the Master Technical Specification, commercial providers must never display unverified prices, simulated availability, or false booking completions. All adapters are gated by strict capability checks.

## 2. Ride-Hailing & Taxi Integrations

### Uber (`server/providers/adapters/UberAdapter.ts`)
- **API Spec**: Uber Developers API (`api.uber.com/v1.2`).
- **Scopes**: Price and time estimates (`estimates/price`, `estimates/time`).
- **Status**: Implemented with Sandbox toggle. Gated by `UBER_SERVER_TOKEN`. Ride request dispatch is disabled pending OAuth rider authorization.

### Uklon (`server/providers/adapters/PartnerTaxiAdapters.ts`)
- **Status**: `REQUIRES_CONTRACT`.
- **Policy**: Internal/undocumented mobile APIs are strictly forbidden. The adapter stub is ready for the official Uklon B2B Fleet API upon contract signing.

### Bolt (`server/providers/adapters/PartnerTaxiAdapters.ts`)
- **Status**: `REQUIRES_CONTRACT`.
- **Policy**: Bolt Ride-Hailing API requires verified commercial partnership. No mock rates or simulated drivers are generated.

## 3. Rail & Intercity Transport

### Ukrzaliznytsia (`server/providers/adapters/IntercityAdapters.ts`)
- **Policy**: In the absence of an official partner booking API, MARSHGO displays verified timetable data and delegates the booking step via deep link to `booking.uz.gov.ua`. Simulated tickets or fake seat inventories are completely banned.

### INFOBUS
- **Status**: `REQUIRES_CONTRACT`.
- **Capabilities**: Inventory lookup, station departure times, ticket reservations via official partner API.

## 4. Payment Acquiring

### monobank (`server/providers/adapters/MonobankAcquiringAdapter.ts`)
- **API**: monobank Acquiring API (`api.monobank.ua/api/merchant`).
- **Capabilities**:
  - Webhook ECDSA signature validation via public key.
  - Payment link / QR creation with Apple Pay and Google Pay support.
  - Transaction status reconciliation and automated refunds.
- **MARSHGO Commission Rules**:
  - Private Carpool: **0% platform fee**.
  - Commercial Transfers / Taxi: Negotiated contract fees.
  - Intercity Bus / Rail: Partner affiliate commission.
