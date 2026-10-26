import 'dotenv/config';
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_KEY_FILE ?? 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID as string;
const ABA = process.env.SHEET_NAME ?? 'Jogos';

// O "id" de cada jogo é o número da linha na planilha (linha 1 = cabeçalho).
export type Jogo = { id: number; [campo: string]: string | number };
export type DadosJogo = Record<string, string | number>;

const aba = `'${ABA}'`;

async function lerCabecalhos(): Promise<string[]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${aba}!1:1`,
  });
  return (res.data.values?.[0] ?? []).map(String);
}

function linhaParaJogo(cabecalhos: string[], linha: unknown[], id: number): Jogo {
  const jogo: Jogo = { id };
  cabecalhos.forEach((h, i) => {
    jogo[h] = (linha[i] as string | undefined) ?? '';
  });
  return jogo;
}

function jogoParaLinha(cabecalhos: string[], dados: DadosJogo): (string | number)[] {
  return cabecalhos.map((h) => dados[h] ?? '');
}

export async function listar(): Promise<Jogo[]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: aba,
  });
  const [cabecalhos = [], ...linhas] = res.data.values ?? [];
  return linhas
    .map((linha, i) => linhaParaJogo(cabecalhos.map(String), linha, i + 2))
    .filter((j) => Object.entries(j).some(([k, v]) => k !== 'id' && v !== ''));
}

export async function buscar(id: number): Promise<Jogo | null> {
  const cabecalhos = await lerCabecalhos();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${aba}!${id}:${id}`,
  });
  const linha = res.data.values?.[0];
  return linha ? linhaParaJogo(cabecalhos, linha, id) : null;
}

export async function criar(dados: DadosJogo): Promise<Jogo> {
  const cabecalhos = await lerCabecalhos();
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: aba,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [jogoParaLinha(cabecalhos, dados)] },
  });
  // updatedRange vem como "Jogos!A12:E12" -> pegamos o 12
  const id = Number(res.data.updates?.updatedRange?.match(/!\D+(\d+)/)?.[1]);
  return { id, ...dados };
}

export async function atualizar(id: number, dados: DadosJogo): Promise<Jogo | null> {
  const atual = await buscar(id);
  if (!atual) return null;

  const cabecalhos = await lerCabecalhos();
  const { id: _ignorado, ...resto } = atual;
  const novo = { ...resto, ...dados };

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${aba}!A${id}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [jogoParaLinha(cabecalhos, novo)] },
  });
  return { id, ...novo };
}

export async function remover(id: number): Promise<boolean> {
  if (!(await buscar(id))) return false;

  // Para apagar a linha precisamos do sheetId numérico da aba
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: 'sheets.properties(sheetId,title)',
  });
  const sheetId = meta.data.sheets?.find((s) => s.properties?.title === ABA)?.properties?.sheetId;
  if (sheetId === undefined || sheetId === null) throw new Error(`Aba "${ABA}" não encontrada`);

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
