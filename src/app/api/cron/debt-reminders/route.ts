import { captureNetWorth } from "@/lib/net-worth-history";
import { runRecurring } from "@/lib/recurring-runner";
import { formatMoney } from "@/lib/currency";
import type { NextRequest } from "next/server";
import nodemailer from "nodemailer";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { getDefaultUser } from "@/lib/get-default-user";
import { buildDebtReminders, paymentCycleKey } from "@/lib/debt-reminders";
import { selectEmailReminders } from "@/lib/email-reminder-policy";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(request: NextRequest) {
  return Boolean(process.env.CRON_SECRET) &&
    request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

function emailSettings() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.REMINDER_EMAIL_FROM || user;
  const to = process.env.REMINDER_EMAIL_TO;
  const port = Number(process.env.SMTP_PORT || "465");
  if (!host || !user || !pass || !from || !to || !Number.isInteger(port)) {
    throw new Error("EMAIL_CONFIGURATION_INCOMPLETE");
  }
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === "true" : port === 465;
  const transporter = nodemailer.createTransport({
    host, port, secure, requireTLS: !secure,
    auth: { user, pass }, connectionTimeout: 10000,
    greetingTimeout: 10000, socketTimeout: 15000,
  });
  return { transporter, from, to };
}

function errorCode(error: unknown) {
  if (error instanceof Error && error.message === "EMAIL_CONFIGURATION_INCOMPLETE") {
    return error.message;
  }
  const code = (error as { code?: unknown })?.code;
  return typeof code === "string" ? code : "REMINDER_OPERATION_FAILED";
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

// Explicit, authenticated test. No debt data is read and no reminders are enabled.
export async function POST(request: NextRequest) {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  const body = await request.json().catch(() => null);
  if (body?.action !== "send-test") {
    return Response.json({ error: "Expected action: send-test" }, { status: 400 });
  }
  let settings: ReturnType<typeof emailSettings> | undefined;
  try {
    settings = emailSettings();
    await settings.transporter.sendMail({
      from: settings.from, to: settings.to,
      subject: "PocketPilot: email connection test",
      text: "PocketPilot can send email from its online server. This is a test only. Automatic reminders are not enabled by this test.",
    });
    return Response.json({ success: true, testEmailSent: true });
  } catch (error) {
    return Response.json({ success: false, error: errorCode(error) }, { status: 502 });
  } finally { settings?.transporter.close(); }
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  let recurring: Awaited<ReturnType<typeof runRecurring>> | undefined;
  if (process.env.RECURRING_ENABLED === "true") {
    try { recurring = await runRecurring(prisma, "user-1"); if(recurring.failures.length) console.error("Recurring schedules need review", recurring.failures); }
    catch { console.error("Recurring processing failed; continuing debt reminders"); recurring = { created: 0, failures: ["PROCESSING_FAILED"] }; }
  }
  // Daily capture for the personal production owner; never mix Preview users.
  if (process.env.NET_WORTH_HISTORY_ENABLED === "true" && process.env.VERCEL_ENV === "production") {
    for (const currency of ["USD", "CAD"]) {
      try { await captureNetWorth(prisma, "user-1", currency); }
      catch { console.error("Net-worth history capture failed", { currency }); }
    }
  }
  if (process.env.REMINDERS_ENABLED !== "true") {
    return Response.json({ success: true, skipped: "Automatic reminders are disabled", recurring });
  }
  let settings: ReturnType<typeof emailSettings> | undefined;
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Edmonton", year: "numeric", month: "numeric", day: "numeric",
    }).formatToParts(new Date());
    const part = (name: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find(item => item.type === name)?.value);
    const today = new Date(part("year"), part("month") - 1, part("day"), 12);
    const user = await getDefaultUser();
    const debts = await prisma.debt.findMany({ where: { userId: user.id, isClosed: false } });
    const sources = debts.map(debt => {
      const cycle = debt.dueDayOfMonth ? paymentCycleKey(debt.dueDayOfMonth, today) : null;
      return {
        id: debt.id, name: debt.name, type: debt.type, currency: debt.currency,
        lender: debt.lender, currentBalance: Number(debt.currentBalance),
        minimumPayment: debt.minimumPayment ? Number(debt.minimumPayment) : null,
        minimumPaymentPaid: cycle && debt.minimumPaymentCycle === cycle
          ? Number(debt.minimumPaymentPaid) : 0,
        dueDayOfMonth: debt.dueDayOfMonth, statementClosingDay: debt.statementClosingDay,
      };
    });
    const reminders = selectEmailReminders(buildDebtReminders(sources, today, 2));
    if (!reminders.length) return Response.json({ success: true, sent: 0 });
    settings = emailSettings();
    // Fail before reserving deliveries if SMTP authentication cannot complete.
    await settings.transporter.verify();
    let sent = 0;
    let skipped = 0;
    const failures: { debtId: string; error: string }[] = [];
    for (const reminder of reminders) {
      const deliveryId = randomUUID();
      // A unique DB key reserves the send before SMTP, including concurrent invocations.
      const claim = await prisma.$queryRaw<{ id: string }[]>`
        INSERT INTO "DebtReminderDelivery" ("id", "userId", "debtId", "dueDate", "status")
        VALUES (${deliveryId}, ${user.id}, ${reminder.debtId}, ${reminder.date}, 'PENDING')
        ON CONFLICT ("userId", "debtId", "dueDate") DO NOTHING RETURNING "id"`;
      if (!claim.length) { skipped++; continue; }
      const amount = reminder.amount && reminder.amount > 0
        ? formatMoney(reminder.amount, reminder.currency) : "Check your statement for the minimum due";
      const text = `${reminder.name}: payment due in 2 days, on ${reminder.date}. ${amount}. ${reminder.detail}`;
      try {
        const result = await settings.transporter.sendMail({
          from: settings.from, to: settings.to,
          subject: `PocketPilot: ${reminder.name} payment due in 2 days`, text,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px"><h2>Payment due in 2 days</h2><p><strong>${escapeHtml(reminder.name)}</strong></p><p>Due date: ${escapeHtml(reminder.date)}</p><p>${escapeHtml(amount)}</p><p>${escapeHtml(reminder.detail)}</p><p>Open PocketPilot to review or record your payment.</p></div>`,
        });
        if (!result.accepted?.length) throw new Error("EMAIL_NOT_ACCEPTED");
        await prisma.$executeRaw`
          UPDATE "DebtReminderDelivery" SET "status" = 'SENT', "sentAt" = CURRENT_TIMESTAMP
          WHERE "id" = ${deliveryId}`;
        sent++;
      } catch (error) {
        // SMTP failures can be ambiguous. Never automatically resend a reserved delivery.
        const code = errorCode(error);
        await prisma.$executeRaw`
          UPDATE "DebtReminderDelivery" SET "status" = 'NEEDS_REVIEW', "errorCode" = ${code}
          WHERE "id" = ${deliveryId}`;
        failures.push({ debtId: reminder.debtId, error: code });
      }
    }
    return Response.json({ success: !failures.length, sent, skipped, failures },
      { status: failures.length ? 502 : 200 });
  } catch (error) {
    return Response.json({ success: false, error: errorCode(error) }, { status: 502 });
  } finally { settings?.transporter.close(); }
}
