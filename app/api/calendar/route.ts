import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(request: Request) {
  const event = await request.json();
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) return NextResponse.json({ configured: false, message: "Google Calendar bağlantısı için OAuth bilgileri eksik." });
  try {
    const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const calendar = google.calendar({ version: "v3", auth });
    const start = new Date(`${event.date}T${event.time || "18:00"}:00+03:00`);
    const durationMinutes = Number.parseInt(String(event.duration || "60"), 10) || 60;
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    const response = await calendar.events.insert({ calendarId: "primary", requestBody: { summary: event.title, description: `${event.areaId ? "FocusFlow çalışma planı" : ""}\nBir hafta kala hatırlatma: beratcamm0606@gmail.com`, start: { dateTime: start.toISOString(), timeZone: "Europe/Istanbul" }, end: { dateTime: end.toISOString(), timeZone: "Europe/Istanbul" } } });
    return NextResponse.json({ configured: true, id: response.data.id, link: response.data.htmlLink });
  } catch { return NextResponse.json({ error: "Takvim etkinliği oluşturulamadı." }, { status: 500 }); }
}
