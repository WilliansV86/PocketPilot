import { test } from "node:test";
import assert from "node:assert/strict";
import { correctedReceivable } from "../src/lib/receivable-correction";
test("Correcting original amount preserves repayments", () => {
 assert.deepEqual(correctedReceivable(1200,[200,150]),{amountOriginal:1200,amountOutstanding:850,status:"PARTIAL"});
 assert.throws(()=>correctedReceivable(300,[200,150]),/less than/);
});
test("Payment corrections can settle or reopen a receivable", () => {
 assert.equal(correctedReceivable(100,[100]).status,"PAID");
 assert.deepEqual(correctedReceivable(100,[80]),{amountOriginal:100,amountOutstanding:20,status:"PARTIAL"});
 assert.equal(correctedReceivable(100,[]).status,"OPEN");
});
test("Corrections preserve cents and reject invalid amounts", () => {
 assert.equal(correctedReceivable(0.30,[0.10,0.20]).amountOutstanding,0);
 for (const invalid of [0,-1,NaN,Infinity,0.001]) assert.throws(()=>correctedReceivable(invalid,[]));
 assert.throws(()=>correctedReceivable(100,[-1]));
});
