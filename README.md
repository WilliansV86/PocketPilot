# PocketPilot - Personal Finance Manager

![PocketPilot Logo](https://via.placeholder.com/150x150.png?text=PocketPilot)

PocketPilot is a personal finance management web application that helps you track your finances, manage accounts, and monitor your spending habits.

## Features

- **Dashboard** - View a comprehensive overview of your financial status with charts and statistics
- **Accounts Management** - Create and manage different types of financial accounts (checking, savings, credit cards, etc.)
- **Transactions Tracking** - Record and categorize all your financial transactions
- **Categories System** - Organize your spending and income with customizable categories and groups
- **Interactive Charts** - Visualize your spending habits and financial trends

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Server Actions for CRUD operations
- **Database**: Prisma ORM with SQLite (development) / PostgreSQL (production)
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/pocketpilot.git
cd pocketpilot
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up the database:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed the database with default data
npm run db:seed
```

4. Start the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Database Configuration

By default, the application uses SQLite for development. To use PostgreSQL:

1. Update the database provider in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Add your PostgreSQL connection string to the `.env` file:

```
DATABASE_URL="postgresql://username:password@localhost:5432/pocketpilot?schema=public"
```

## Project Structure

```
pocketpilot/
├── src/
│   ├── app/                 # Next.js App Router routes
│   ├── components/          # React components
│   │   ├── accounts/        # Account-related components
│   │   ├── categories/      # Category-related components
│   │   ├── dashboard/       # Dashboard components and charts
│   │   ├── layout/          # Layout components
│   │   ├── transactions/    # Transaction-related components
│   │   └── ui/              # shadcn/ui components
│   ├── lib/                 # Utility functions and shared logic
│   │   ├── actions/         # Server actions for CRUD operations
│   │   ├── db.ts            # Prisma client instance
│   │   └── utils.ts         # Helper functions
├── prisma/                  # Prisma schema and migrations
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed script for default data
└── public/                  # Static files
```

## Core Modules

### Accounts Module

Manage financial accounts with different types (checking, savings, credit cards, etc.). Each account tracks its own balance and transactions.

### Transactions Module

Record financial transactions with details such as amount, date, category, and account. Transactions automatically update account balances.

### Categories Module

Organize transactions into customizable categories and groups for better financial tracking and reporting.

### Dashboard Module

Visual representation of financial data with charts and statistics including:
- Total balance across all accounts
- Monthly income vs. expenses
- Spending breakdown by category
- Recent transaction history

## Future Enhancements

- User authentication with Google login
- Budget planning and tracking
- Financial goals setting
- Bill reminders and recurring transactions
- Data import/export functionality
- Mobile app integration

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://prisma.io/) - ORM for database access
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Recharts](https://recharts.org/) - Charting library
