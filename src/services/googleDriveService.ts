import { FontStyleId, NoteItem, UserProfile } from '../types/note';

const BACKUP_FILE_NAME = 'easynote_backup.json';

export interface DriveBackupPayload {
  version: number;
  updatedAt: string;
  notes: NoteItem[];
  profile: {
    customName: string;
    customAvatar: string;
    language: 'bn' | 'en';
    darkMode: boolean;
    liquidGlass: boolean;
    fontStyle?: FontStyleId;
    notificationsEnabled: boolean;
    autoDriveBackup: boolean;
  };
}

async function driveFetch<T>(url: string, accessToken: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers || {}),
    },
  });

  if (res.status === 401) {
    throw new Error('GOOGLE_TOKEN_EXPIRED');
  }
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Drive API error (${res.status}): ${errText}`);
  }
  if (res.status === 204) {
    return {} as T;
  }
  return (await res.json()) as T;
}

async function findBackupFileId(accessToken: string): Promise<string | null> {
  const q = encodeURIComponent(`name='${BACKUP_FILE_NAME}' and trashed=false`);
  const data = await driveFetch<{ files?: { id: string; modifiedTime?: string }[] }>(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,modifiedTime)`,
    accessToken
  );
  return data.files && data.files.length > 0 ? data.files[0].id : null;
}

export async function saveBackupToGoogleDrive(
  accessToken: string,
  notes: NoteItem[],
  profile: UserProfile
): Promise<string> {
  const nowIso = new Date().toISOString();
  const payload: DriveBackupPayload = {
    version: 2,
    updatedAt: nowIso,
    notes,
    profile: {
      customName: profile.customName,
      customAvatar: profile.customAvatar,
      language: profile.language,
      darkMode: profile.darkMode,
      liquidGlass: profile.liquidGlass,
      fontStyle: profile.fontStyle,
      notificationsEnabled: profile.notificationsEnabled,
      autoDriveBackup: profile.autoDriveBackup,
    },
  };

  const existingFileId = await findBackupFileId(accessToken);

  if (existingFileId) {
    await driveFetch(
      `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(existingFileId)}?uploadType=media`,
      accessToken,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
  } else {
    const boundary = `easynote_${Date.now()}`;
    const metadata = JSON.stringify({
      name: BACKUP_FILE_NAME,
      parents: ['appDataFolder'],
    });
    const body =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${metadata}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(payload)}\r\n` +
      `--${boundary}--`;

    await driveFetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      accessToken,
      {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );
  }

  return nowIso;
}

export async function loadBackupFromGoogleDrive(
  accessToken: string
): Promise<DriveBackupPayload | null> {
  const fileId = await findBackupFileId(accessToken);
  if (!fileId) return null;

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  if (res.status === 401) {
    throw new Error('GOOGLE_TOKEN_EXPIRED');
  }
  if (!res.ok) {
    throw new Error(`Failed to read Google Drive backup (${res.status})`);
  }
  return (await res.json()) as DriveBackupPayload;
}
