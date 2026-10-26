import 'dotenv/config';
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_KEY_FILE ?? 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID as string;
const SHEET_NAME = process.env.SHEET_NAME ?? 'Games';

export type Game = { id: number; [field: string]: string | number };
export type GameData = Record<string, string | number>;

const sheetRef = `'${SHEET_NAME}'`;

async function readHeaders(): Promise<string[]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetRef}!1:1`,
  });
  return (res.data.values?.[0] ?? []).map(String);
}

function rowToGame(headers: string[], row: unknown[], id: number): Game {
  const game: Game = { id };
  headers.forEach((header, i) => {
    game[header] = (row[i] as string | undefined) ?? '';
  });
  return game;
}

function gameToRow(headers: string[], data: GameData): (string | number)[] {
  return headers.map((header) => data[header] ?? '');
}

export async function list(): Promise<Game[]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetRef,
  });
  const [headers = [], ...rows] = res.data.values ?? [];
  return rows
    .map((row, i) => rowToGame(headers.map(String), row, i + 2))
    .filter((g) => Object.entries(g).some(([key, value]) => key !== 'id' && value !== ''));
}

export async function getById(id: number): Promise<Game | null> {
  const headers = await readHeaders();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetRef}!${id}:${id}`,
  });
  const row = res.data.values?.[0];
  return row ? rowToGame(headers, row, id) : null;
}

export async function create(data: GameData): Promise<Game> {
  const headers = await readHeaders();
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetRef,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [gameToRow(headers, data)] },
  });
  const id = Number(res.data.updates?.updatedRange?.match(/!\D+(\d+)/)?.[1]);
  return { id, ...data };
}

export async function update(id: number, data: GameData): Promise<Game | null> {
  const current = await getById(id);
  if (!current) return null;

  const headers = await readHeaders();
  const { id: _ignored, ...rest } = current;
  const merged = { ...rest, ...data };

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetRef}!A${id}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [gameToRow(headers, merged)] },
  });
  return { id, ...merged };
}

export async function remove(id: number): Promise<boolean> {
  if (!(await getById(id))) return false;

  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: 'sheets.properties(sheetId,title)',
  });
  const sheetId = meta.data.sheets?.find((s) => s.properties?.title === SHEET_NAME)?.properties?.sheetId;
  if (sheetId === undefined || sheetId === null) throw new Error(`Sheet tab "${SHEET_NAME}" not found`);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: { sheetId, dimension: 'ROWS', startIndex: id - 1, endIndex: id },
          },
        },
      ],
    },
  });
  return true;
}