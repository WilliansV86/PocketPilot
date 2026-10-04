import { test } from "node:test";
import assert from "node:assert/strict";
import { getDateRangePreset, statsDateLabel } from "../src/lib/stats-date-range";
import { monthlyCashflow, categorySpending, dailySpending } from "../src/lib/stats-aggregation";

test("YTD ends today in Alberta and excludes future transactions", () => {
 const range = getDateRangePreset("ytd", new Date("2026-10-04T02:00:00Z"));
 assert.equal(range.start.toISOString(), "2026-01-01T00:00:00.000Z");
 assert.equal(range.end.toISOString(), "2026-10-03T23:59:59.999Z");
 const result = monthlyCashflow([{ date: new Date("2026-10-03T12:00:00Z"), amount: "100", type: "INCOME" }, { date: new Date("2026-10-04T12:00:00Z"), amount: "999", type: "INCOME" }],range);
 assert.equal(result.length,10); assert.equal(result[9].income,100);
});
test("Alberta New Year and leap-month boundaries", () => {
 const previousYear = getDateRangePreset("ytd",new Date("2027-01-01T02:00:00Z"));
 assert.equal(previousYear.start.toISOString(),"2026-01-01T00:00:00.000Z");
 assert.equal(previousYear.end.toISOString(),"2026-12-31T23:59:59.999Z");
 const leap = getDateRangePreset("last_month",new Date("2024-03-02T12:00:00Z"));
 assert.equal(leap.end.toISOString(),"2024-02-29T23:59:59.999Z");
 assert.equal(dailySpending([],leap).length,29);
 const rollover = getDateRangePreset("last_3_months",new Date("2027-01-10T12:00:00Z"));
 assert.equal(rollover.start.toISOString(),"2026-11-01T00:00:00.000Z");
 assert.deepEqual(monthlyCashflow([],rollover).map(r=>r.month),["2026-11","2026-12","2027-01"]);
});
test("Cashflow excludes transfers, fills gaps, and reconciles cents", () => {
 const range = getDateRangePreset("last_3_months",new Date("2026-10-04T12:00:00Z"));
 const transactions = [
  {date:new Date("2026-08-01T12:00:00Z"),amount:"1000.10",type:"INCOME"},
  {date:new Date("2026-10-01T12:00:00Z"),amount:"0.10",type:"EXPENSE",category:null},
  {date:new Date("2026-10-01T12:00:00Z"),amount:"0.20",type:"EXPENSE",category:{id:"food",name:"Food",color:"#123456"}},
  {date:new Date("2026-10-02T12:00:00Z"),amount:"200",type:"TRANSFER"},
 ];
 const cash = monthlyCashflow(transactions,range);
 assert.equal(cash[1].income,0);assert.equal(cash[1].expenses,0);
 assert.equal(cash[2].expenses,0.30);assert.equal(cash[2].net,-0.30);
 const expenses = transactions.filter(t=>t.type==="EXPENSE");
 const categories = categorySpending(expenses);
 assert.equal(categories.find(c=>c.name==="Uncategorized")?.amount,0.10);
 assert.equal(Math.round(categories.reduce((sum,c)=>sum+c.amount,0)*100),30);
 const days = dailySpending(expenses,range);
 assert.equal(days.find(d=>d.date==="2026-10-01")?.amount,0.30);
 assert.equal(days.find(d=>d.date==="2026-10-02")?.amount,0);
});
test("Category IDs stay separate and no small category is discarded", () => {
 const categories = categorySpending(Array.from({length:12},(_,i)=>({date:new Date(),amount:i+1,category:{id:String(i),name:"Shared name",color:null}})));
 assert.equal(categories.length,12);assert.equal(categories.reduce((sum,c)=>sum+c.amount,0),78);
});
test("Chart labels keep the stored calendar date in all browser timezones", () => {
 assert.match(statsDateLabel("2026-01",true),/Jan/);
 assert.match(statsDateLabel("2026-10-01"),/Oct 1/);
});
