# Net Worth Engine Documentation

## Overview

The Net Worth Engine is a centralized calculation system that provides consistent net worth calculations across the entire PocketPilot application. It ensures that all financial data is calculated using the same logic and updates automatically across all pages.

## Architecture

### Core Components

1. **Calculation Engine** (`src/lib/finance/net-worth.ts`)
   - Centralized calculation functions
   - Asset and liability categorization
   - Normalization utilities for different data types

2. **Server Actions** (`src/lib/actions/net-worth-actions.ts`)
   - Data fetching from database
   - Net worth calculation using the engine
   - Revalidation utilities for UI updates

3. **UI Integration**
   - Dashboard net worth cards and breakdown
   - Consistent calculations across all pages
   - Real-time updates after data changes

## Calculation Formula

```
Net Worth = Total Assets - Total Liabilities
```

### Assets Breakdown

1. **Account Assets** (`getAccountAssetTotal`)
   - Account types: CHECKING, SAVINGS, CASH, INVESTMENT, OTHER
   - Only positive balances count as assets
   - Formula: `SUM(balance) WHERE type IN asset_types AND balance > 0`

2. **Receivables** (`getReceivablesTotal`)
   - Money Owed records where status != PAID
   - Only non-archived records
   - Formula: `SUM(amountOutstanding) WHERE status != 'PAID' AND isArchived = false`

### Liabilities Breakdown

1. **Debts** (`getDebtsTotal`)
   - Debt records where isClosed = false
   - Formula: `SUM(currentBalance) WHERE isClosed = false`

2. **Account Liabilities** (`getAccountLiabilityTotal`)
   - Account types: CREDIT, LOAN
   - Uses absolute value of balances
   - Formula: `SUM(ABS(balance)) WHERE type IN liability_types`

## Data Flow

```
Database → Server Actions → Calculation Engine → UI Components
```

1. **Data Fetching**: Server actions fetch raw data from Prisma
2. **Calculation**: Engine processes data using standardized functions
3. **UI Display**: Components show calculated values with proper formatting
4. **Auto-update**: Revalidation triggers refresh after data changes

## Auto-Revalidation System

### Revalidation Trigger Points

After any CRUD operation in these modules:
- ✅ **Accounts** (create, update, delete)
- ✅ **Transactions** (create, update, delete)
- ✅ **Debts** (create, update, delete, payment)
- ✅ **Money Owed** (create, update, delete, payment, archive)

### Revalidated Pages

- `/dashboard` - Main net worth display
- `/accounts` - Account balances and net worth
- `/debts` - Debt totals and net worth impact
- `/money-owed` - Receivables and net worth impact
- `/transactions` - Transaction history affecting net worth

### Implementation

```typescript
// In any CRUD action:
import { revalidateNetWorthPages } from "./net-worth-actions";

// After successful operation:
revalidatePath("/specific-page");
revalidateNetWorthPages(); // Revalidates all net worth pages
```

## Acceptance Test Examples

### Test Case 1: Basic Setup
```
1. Create checking account: $1,000
2. Create savings account: $500
3. Create credit account: -$200
4. Create debt: $3,000
5. Create money owed: $150

Expected Results:
- Account assets = $1,500
- Account liabilities = $200
- Debts = $3,000
- Receivables = $150
- Total assets = $1,650
- Total liabilities = $3,200
- Net worth = -$1,550
```

### Test Case 2: Money Owed Payment
```
Record $50 payment from money owed into checking account:

Before:
- Receivables = $150
- Checking = $1,000
- Net worth = -$1,550

After:
- Receivables = $100 (-$50)
- Checking = $1,050 (+$50)
- Net worth = -$1,550 (unchanged)

Result: Asset swap, net worth unchanged
```

### Test Case 3: Debt Payment
```
Make $100 debt payment from checking account:

Before:
- Checking = $1,000
- Debt = $3,000
- Net worth = -$1,550

After:
- Checking = $900 (-$100)
- Debt = $2,900 (-$100)
- Net worth = -$1,550 (unchanged)

Result: Asset and liability both decrease, net worth unchanged
```

## UI Components

### Dashboard Cards

1. **Main Net Worth Card** (2 columns wide)
   - Large net worth value
   - Total assets and liabilities
   - Status indicator (positive/negative/neutral)

2. **Detailed Breakdown Cards** (6 cards)
   - Account assets
   - Receivables
   - Total assets (green)
   - Debts
   - Account liabilities
   - Total liabilities (red)

### Page Integration

- **Accounts Page**: Shows net worth impact of account changes
- **Debts Page**: Displays total debt using same calculation
- **Money Owed Page**: Shows total receivables consistently

## Technical Implementation

### Type Safety

```typescript
interface NetWorthBreakdown {
  assets: {
    accountAssets: number;
    receivables: number;
    total: number;
  };
  liabilities: {
    debts: number;
    accountLiabilities: number;
    total: number;
  };
  netWorth: number;
}
```

### Error Handling

- Graceful fallbacks when models don't exist
- Validation of data types and ranges
- User-friendly error messages
- Loading states in UI components

### Performance

- Optimized database queries with only needed fields
- Efficient calculations with minimal iterations
- Cached results where appropriate
- Selective revalidation to avoid unnecessary refreshes

## Business Rules

1. **Asset Classification**: Only positive balances in asset accounts
2. **Liability Classification**: Absolute values of credit/loan accounts
3. **Receivables**: Only outstanding amounts from unpaid records
4. **Debts**: Only balances from open (non-closed) debt records
5. **Archived Records**: Excluded from all calculations

## Future Enhancements

1. **Historical Tracking**: Net worth changes over time
2. **Projections**: Future net worth based on trends
3. **Goals**: Net worth targets and progress tracking
4. **Comparisons**: Period-over-period analysis
5. **Export**: Net worth reports in various formats

## Troubleshooting

### Common Issues

1. **Incorrect Calculations**: Check account types and balances
2. **Missing Data**: Verify database connections and model availability
3. **UI Not Updating**: Ensure revalidation is called after CRUD operations
4. **Type Errors**: Verify data normalization in calculation engine

### Debug Tools

- Console logs in calculation functions
- Network tab for API responses
- Database queries in server actions
- Component props in React DevTools

## Maintenance

### Adding New Account Types

1. Update `ASSET_ACCOUNT_TYPES` or `LIABILITY_ACCOUNT_TYPES` constants
2. Test calculation with sample data
3. Update documentation

### Modifying Calculation Logic

1. Update functions in `net-worth.ts`
2. Run acceptance tests
3. Verify UI consistency
4. Update revalidation if needed

This Net Worth Engine provides a solid foundation for accurate financial calculations across the entire PocketPilot application.
