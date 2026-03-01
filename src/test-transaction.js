// Simple test to verify transaction creation works
import { createTransaction } from './lib/actions/transaction-actions.js';

async function testTransaction() {
  const formData = new FormData();
  formData.append("description", "Test Transaction");
  formData.append("amount", "100");
  formData.append("date", "2026-02-25");
  formData.append("type", "EXPENSE");
  formData.append("accountId", "test-account-id");
  formData.append("categoryId", "");
  formData.append("notes", "Test notes");

  try {
    const result = await createTransaction(formData);
    console.log("Transaction creation result:", result);
  } catch (error) {
    console.error("Transaction creation error:", error);
  }
}

testTransaction();
