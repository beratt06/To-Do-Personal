import { NextResponse } from "next/server";
import { Resend } from "resend";
import { google } from "googleapis";

export const dynamic = "force-static";

export async function GET(request: Request) {
  if (process.env.CRON_SECRET && request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ sent: 0, message: "RESEND_API_KEY tanımlı değil." });
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) return NextResponse.json({ sent: 0, message: "Google Calendar OAuth bilgileri tanımlı değil." });
  const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  const calendar = google.calendar({ version: "v3", auth });
  const now = new Date(); const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const list = await calendar.events.list({ calendarId: "primary", timeMin: now.toISOString(), timeMax: inSevenDays.toISOString(), singleEvents: true, orderBy: "startTime" });
  const resend = new Resend(process.env.RESEND_API_KEY);
  const recipient = process.env.REMINDER_TO || "beratcamm0606@gmail.com";
  let sent = 0;
  for (const event of list.data.items || []) {
    if (!event.id || event.extendedProperties?.private?.focusflowReminderSent === "true") continue;
    const start = event.start?.dateTime || event.start?.date || "yaklaşan tarihte";
    await resend.emails.send({ from: process.env.MAIL_FROM || "FocusFlow <onboarding@resend.dev>", to: recipient, subject: `FocusFlow — ${event.summary || "yaklaşan çalışma"} hazırlığı`, html: `<h2>Gelecek haftaya hazır mısın?</h2><p><strong>${event.summary || "Çalışma etkinliği"}</strong> etkinliğin ${start} tarihinde.</p><p>Çalışma alanlarını ve görev başlıklarını kontrol ederek hazırlanmaya başlayabilirsin.</p>` });
    await calendar.events.patch({ calendarId: "primary", eventId: event.id, requestBody: { extendedProperties: { private: { ...(event.extendedProperties?.private || {}), focusflowReminderSent: "true" } } } });
    sent += 1;
  }
  return NextResponse.json({ sent, recipient });
}
