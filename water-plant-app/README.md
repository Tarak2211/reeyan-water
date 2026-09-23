# 💧 AquaPure — Mineral Water Plant Delivery Management System

A Node.js/Express REST API backend for managing mineral water jug deliveries, billing, customer accounts, and delivery staff. Features AI-powered jug counting via GPT-4o Vision and automated WhatsApp receipt delivery.

---

## Features

- **Customer Management** — CRUD, pending balance tracking, payment recording
- **Delivery Boy Management** — Staff profiles, daily delivery summaries
- **AI-Powered Daily Entries** — Upload a delivery photo; GPT-4o Vision automatically counts full/empty jugs
- **Manual Entries** — Override AI counts or enter data without an image
- **Automated Billing** — Bill generated instantly on every confirmed entry
- **PDF Receipts** — Branded A5 delivery receipt PDFs generated with PDFKit
- **WhatsApp Delivery** — Receipt PDF sent to customer's WhatsApp via Meta Business API
- **Reports** — Daily summaries and per-customer ledger with date-range filters
- **JWT Auth** — Bearer token authentication with ADMIN / STAFF role support

---

## Tech Stack

| Layer         | Technology                    |
|---------------|-------------------------------|
| Runtime       | Node.js                       |
| Framework     | Express 4                     |
| ORM           | Prisma 5 (PostgreSQL)         |
| AI Vision     | OpenAI GPT-4o (`openai` SDK)  |
| PDF           | PDFKit                        |
| WhatsApp      | Meta Cloud API v20.0          |
| Auth          | jsonwebtoken + bcryptjs        |
| File Uploads  | Multer                        |

---

## Project Structure

```
water-plant-app/
├── src/
│   ├── config/
│   │   ├── database.js       # Prisma client singleton
│   │   └── env.js            # Centralised env vars
│   ├── controllers/
│   │   ├── customerController.js
│   │   ├── deliveryBoyController.js
│   │   ├── entryController.js
│   │   ├── billingController.js
│   │   └── reportController.js
│   ├── middleware/
│   │   ├── auth.js           # JWT authentication & role guard
│   │   ├── upload.js         # Multer image upload config
│   │   └── errorHandler.js   # Global error handler
│   ├── routes/
│   │   ├── customerRoutes.js
│   │   ├── deliveryBoyRoutes.js
│   │   ├── entryRoutes.js
│   │   ├── billingRoutes.js
│   │   └── reportRoutes.js
│   ├── services/
│   │   ├── visionService.js  # GPT-4o image analysis
│   │   ├── pdfService.js     # PDFKit receipt generation
│   │   └── whatsappService.js# Meta WhatsApp Cloud API
│   └── app.js                # Express app entry point
├── prisma/
│   └── schema.prisma         # DB schema (User, Customer, DeliveryBoy, DailyEntry, Bill, Payment)
├── uploads/                  # Auto-created: uploaded delivery images
├── pdfs/                     # Auto-created: generated receipt PDFs
├── .env.example
└── package.json
```

---

## Getting Started

### 1. Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key (GPT-4o access)
- Meta WhatsApp Business API credentials

### 2. Install Dependencies

```bash
cd water-plant-app
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in all required values (see [Environment Variables](#environment-variables) below).

### 4. Set Up the Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations (creates all tables)
npm run db:migrate
```

### 5. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:3000`.

---

## Environment Variables

| Variable                     | Description                                      | Required |
|------------------------------|--------------------------------------------------|----------|
| `DATABASE_URL`               | PostgreSQL connection string                     | ✅        |
| `JWT_SECRET`                 | Secret key for signing JWTs                      | ✅        |
| `JWT_EXPIRES_IN`             | JWT expiry duration (e.g. `7d`)                  | ✅        |
| `OPENAI_API_KEY`             | OpenAI API key (GPT-4o Vision)                   | ✅        |
| `WHATSAPP_API_TOKEN`         | Meta WhatsApp Cloud API bearer token             | ✅        |
| `WHATSAPP_PHONE_NUMBER_ID`   | WhatsApp sender phone number ID                  | ✅        |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Meta Business account ID                      | Optional |
| `UPLOAD_DIR`                 | Directory to store uploaded images               | Optional |
| `PDF_DIR`                    | Directory to store generated PDFs                | Optional |
| `PORT`                       | HTTP port (default: `3000`)                      | Optional |
| `APP_NAME`                   | Business name shown on receipts                  | Optional |
| `APP_ADDRESS`                | Business address shown on receipts               | Optional |
| `APP_PHONE`                  | Business phone shown on receipts                 | Optional |
| `APP_GSTIN`                  | GSTIN shown on receipts (optional)               | Optional |

---

## API Reference

All endpoints (except `/health`) require a `Authorization: Bearer <token>` header.

> **Note:** User login/register endpoints are not scaffolded in this version — add them to issue JWTs using `bcryptjs` + `jsonwebtoken` based on the `User` model in the Prisma schema.

### Health

| Method | Path      | Description        |
|--------|-----------|--------------------|
| GET    | `/health` | Server health check |

### Customers

| Method | Path                          | Description                          |
|--------|-------------------------------|--------------------------------------|
| GET    | `/api/customers`              | List all active customers (paginated, searchable) |
| GET    | `/api/customers/:id`          | Get customer details + recent entries/payments |
| POST   | `/api/customers`              | Create new customer                  |
| PUT    | `/api/customers/:id`          | Update customer                      |
| POST   | `/api/customers/:id/payment`  | Record a payment from customer       |

**Create Customer Body:**
```json
{
  "name": "Ramesh Kumar",
  "phone": "9876543210",
  "address": "12 Main St, Mumbai",
  "ratePerJug": 50.00
}
```

**Record Payment Body:**
```json
{
  "amount": 500,
  "method": "UPI",
  "note": "Paid via GPay"
}
```

### Delivery Boys

| Method | Path                              | Description                      |
|--------|-----------------------------------|----------------------------------|
| GET    | `/api/delivery-boys`              | List all active delivery boys    |
| POST   | `/api/delivery-boys`              | Create delivery boy              |
| GET    | `/api/delivery-boys/:id/summary`  | Daily summary (`?date=YYYY-MM-DD`) |

### Daily Entries

| Method | Path                         | Description                                              |
|--------|------------------------------|----------------------------------------------------------|
| GET    | `/api/entries`               | List entries (filter by `customerId`, `deliveryBoyId`, `date`) |
| POST   | `/api/entries/upload-image`  | Create entry with photo — AI counts jugs automatically   |
| POST   | `/api/entries/manual`        | Create entry manually without image                      |

**Upload Image (multipart/form-data):**
```
image        = <file>
customerId   = <uuid>
deliveryBoyId = <uuid>
jugsDispatched = 5
notes        = "Customer was not home initially"
```

**Manual Entry Body:**
```json
{
  "customerId": "<uuid>",
  "deliveryBoyId": "<uuid>",
  "jugsDispatched": 5,
  "jugsDelivered": 5,
  "jugsReturned": 3,
  "notes": "Optional note"
}
```

### Bills

| Method | Path           | Description                            |
|--------|----------------|----------------------------------------|
| GET    | `/api/bills`   | List bills (filter by `customerId`)    |
| GET    | `/api/bills/:id` | Get bill detail                      |

### Reports

| Method | Path                                    | Description                          |
|--------|-----------------------------------------|--------------------------------------|
| GET    | `/api/reports/daily-summary`            | Summary for a date (`?date=YYYY-MM-DD`) |
| GET    | `/api/reports/customer-ledger/:customerId` | Customer ledger (`?from=&to=`)    |

---

## AI + WhatsApp Flow

When `POST /api/entries/upload-image` is called:

1. **Image Upload** — Multer saves the image to `./uploads/`
2. **AI Vision** — GPT-4o analyzes the image and returns full/empty jug counts with confidence level
3. **DB Transaction** — `DailyEntry`, `Bill`, and updated `Customer.pendingBalance` created atomically
4. **PDF Generation** — PDFKit renders a branded A5 receipt to `./pdfs/`
5. **WhatsApp** — The PDF is uploaded to Meta's media server, then sent as a document message to the customer's WhatsApp number
6. **Response** — Returns entry ID, bill number, AI confidence, PDF URL, and WhatsApp status

WhatsApp failures are non-blocking — the entry and bill are always saved even if the WhatsApp send fails.

---

## Database Schema Overview

```
User           — Authentication (ADMIN / STAFF roles)
Customer       — Customer profile + running pending balance
DeliveryBoy    — Delivery staff
DailyEntry     — One delivery event (AI or manual counts)
Bill           — One bill per DailyEntry (1:1 relation)
Payment        — Customer payments (reduces pendingBalance)
```

---

## Scripts

| Script              | Description                          |
|---------------------|--------------------------------------|
| `npm start`         | Start server in production mode      |
| `npm run dev`       | Start with nodemon (auto-reload)     |
| `npm run db:migrate`| Run Prisma migrations                |
| `npm run db:generate`| Regenerate Prisma client            |
| `npm run db:studio` | Open Prisma Studio (DB browser UI)   |

---

## License

MIT
