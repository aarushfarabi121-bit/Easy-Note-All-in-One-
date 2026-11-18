import { inferHolidayEmoji } from '../data/bangladeshHolidays';
import { addDaysYYYYMMDD, getLocalYYYYMMDD } from '../i18n/translations';
import { HolidayItem, NoteDraft } from '../types/note';

interface GoogleCalendarListEntry {
  id: string;
  summary?: string;
  primary?: boolean;
}

interface GoogleCalendarEventRaw {
  id: string;
  summary?: string;
  description?: string;
  status?: string;
  start?: {
    date?: string;
    dateTime?: string;
  };
  end?: {
    date?: string;
    dateTime?: string;
  };
}

export interface SyncedCalendarEvent {
  googleEventId: string;
  googleCalendarId: string;
  title: string;
  description: string;
  eventDate: string;
  eventTime: string;
  endTime: string;
  isAllDay: boolean;
}

const BD_PUBLIC_HOLIDAY_CALENDAR_ID = 'en.bd#holiday@group.v.calendar.google.com';

function parseGoogleDateTime(raw: GoogleCalendarEventRaw): {
  eventDate: string;
  eventTime: string;
  endTime: string;
  isAllDay: boolean;
} {
  if (raw.start?.date) {
    return {
      eventDate: raw.start.date,
      eventTime: '',
      endTime: '',
      isAllDay: true,
    };
  }
  const startDt = raw.start?.dateTime ? new Date(raw.start.dateTime) : new Date();
  const eventDate = getLocalYYYYMMDD(startDt);
  const eventTime = `${String(startDt.getHours()).padStart(2, '0')}:${String(
    startDt.getMinutes()
  ).padStart(2, '0')}`;

  let endTime = '';
  if (raw.end?.dateTime) {
    const endDt = new Date(raw.end.dateTime);
    endTime = `${String(endDt.getHours()).padStart(2, '0')}:${String(
      endDt.getMinutes()
    ).padStart(2, '0')}`;
  }

  return {
    eventDate,
    eventTime,
    endTime,
    isAllDay: false,
  };
}

async function googleFetch<T>(url: string, accessToken: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (res.status === 401) {
    throw new Error('GOOGLE_TOKEN_EXPIRED');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Calendar API error (${res.status}): ${text}`);
  }
  if (res.status === 204) {
    return {} as T;
  }
  return (await res.json()) as T;
}

export async function syncFromGoogleCalendar(accessToken: string): Promise<{
  events: SyncedCalendarEvent[];
  holidays: HolidayItem[];
}> {
  const now = new Date();
  const timeMin = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Discover user's calendar list
  let calendars: GoogleCalendarListEntry[] = [{ id: 'primary', primary: true }];
  try {
    const listData = await googleFetch<{ items?: GoogleCalendarListEntry[] }>(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      accessToken
    );
    if (listData.items && listData.items.length > 0) {
      calendars = listData.items;
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'GOOGLE_TOKEN_EXPIRED') throw err;
    // Fallback to primary only if calendarList fails
  }

  const holidayCalendars = calendars.filter(
    (c) =>
      c.id.includes('#holiday@') ||
      (c.summary || '').toLowerCase().includes('holiday')
  );

  // Also check BD public holiday calendar if not explicitly subscribed
  const hasBdHolidayCal = holidayCalendars.some((c) => c.id === BD_PUBLIC_HOLIDAY_CALENDAR_ID);
  const holidayCalendarIds = [
    ...holidayCalendars.map((c) => c.id),
    ...(hasBdHolidayCal ? [] : [BD_PUBLIC_HOLIDAY_CALENDAR_ID]),
  ];

  // 2. Fetch primary calendar events
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '150',
  });

  const primaryEventsData = await googleFetch<{ items?: GoogleCalendarEventRaw[] }>(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    accessToken
  );

  const events: SyncedCalendarEvent[] = (primaryEventsData.items || [])
    .filter((ev) => ev.status !== 'cancelled' && Boolean(ev.summary))
    .map((ev) => {
      const parsed = parseGoogleDateTime(ev);
      return {
        googleEventId: ev.id,
        googleCalendarId: 'primary',
        title: (ev.summary || 'Untitled Event').slice(0, 200),
        description: (ev.description || '').slice(0, 4000),
        ...parsed,
      };
    });

  // 3. Fetch holiday calendars
  const holidays: HolidayItem[] = [];
  const holidayParams = new URLSearchParams({
    timeMin: new Date(now.getFullYear(), 0, 1).toISOString(),
    timeMax: new Date(now.getFullYear() + 1, 11, 31).toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100',
  });

  for (const calId of holidayCalendarIds) {
    try {
      const encodedId = encodeURIComponent(calId);
      const hData = await googleFetch<{ items?: GoogleCalendarEventRaw[] }>(
        `https://www.googleapis.com/calendar/v3/calendars/${encodedId}/events?${holidayParams.toString()}`,
        accessToken
      );
      for (const item of hData.items || []) {
        if (!item.summary || !item.start?.date) continue;
        holidays.push({
          id: `gcal-${item.id}`,
          date: item.start.date,
          nameEn: item.summary,
          nameBn: item.summary,
          emoji: inferHolidayEmoji(item.summary),
          type: 'google',
          accentColor: 'indigo',
        });
      }
    } catch {
      // Public holiday calendar may be inaccessible in some accounts; curated BD holidays cover it
    }
  }

  return { events, holidays };
}

function buildGoogleEventBody(draft: NoteDraft) {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dhaka';
  if (draft.isAllDay || !draft.eventTime) {
    return {
      summary: draft.title.trim(),
      description: draft.description.trim(),
      start: { date: draft.eventDate },
      end: { date: addDaysYYYYMMDD(draft.eventDate, 1) },
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 1440 }],
      },
    };
  }

  const startIso = `${draft.eventDate}T${draft.eventTime}:00`;
  const [startH, startM] = draft.eventTime.split(':').map(Number);
  const startTotalMins = (Number.isFinite(startH) ? startH : 0) * 60 + (Number.isFinite(startM) ? startM : 0);

  let endTimeStr = draft.endTime;
  if (!endTimeStr) {
    const endTotal = (startTotalMins + 60) % 1440;
    endTimeStr = `${String(Math.floor(endTotal / 60)).padStart(2, '0')}:${String(endTotal % 60).padStart(2, '0')}`;
  }

  const [endH, endM] = endTimeStr.split(':').map(Number);
  const endTotalMins = (Number.isFinite(endH) ? endH : 0) * 60 + (Number.isFinite(endM) ? endM : 0);
  const endDateStr =
    endTotalMins <= startTotalMins
      ? addDaysYYYYMMDD(draft.eventDate, 1)
      : draft.eventDate;
  const endIso = `${endDateStr}T${endTimeStr}:00`;

  return {
    summary: draft.title.trim(),
    description: draft.description.trim(),
    start: { dateTime: startIso, timeZone },
    end: { dateTime: endIso, timeZone },
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: 1440 }],
    },
  };
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  draft: NoteDraft
): Promise<{ googleEventId: string; googleCalendarId: string }> {
  const created = await googleFetch<{ id: string }>(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify(buildGoogleEventBody(draft)),
    }
  );
  return {
    googleEventId: created.id,
    googleCalendarId: 'primary',
  };
}

export async function updateGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  draft: NoteDraft
): Promise<void> {
  const encodedCal = encodeURIComponent(calendarId || 'primary');
  const encodedEv = encodeURIComponent(eventId);
  await googleFetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodedCal}/events/${encodedEv}`,
    accessToken,
    {
      method: 'PATCH',
      body: JSON.stringify(buildGoogleEventBody(draft)),
    }
  );
}

export async function deleteGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const encodedCal = encodeURIComponent(calendarId || 'primary');
  const encodedEv = encodeURIComponent(eventId);
  await googleFetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodedCal}/events/${encodedEv}`,
    accessToken,
    {
      method: 'DELETE',
    }
  );
}
