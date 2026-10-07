/**
 * Google Sheets Service - Placeholder for Google Sheets API integration
 *
 * To activate:
 * 1. Create a Google Cloud project at https://console.cloud.google.com
 * 2. Enable Google Sheets API
 * 3. Create a Service Account and download the JSON key
 * 4. Set environment variable:
 *    - GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
 *    - GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
 *
 * Documentation: https://developers.google.com/sheets/api/quickstart/nodejs
 */

interface SheetConfig {
  spreadsheetId: string;
  range?: string;
  apiKey?: string;
}

interface SheetData {
  headers: string[];
  rows: string[][];
}

/**
 * Read data from a Google Sheet using the API key (public sheets only)
 * For private sheets, use the service account method
 */
export async function readPublicSheet(config: SheetConfig): Promise<SheetData> {
  const apiKey = config.apiKey || process.env.GOOGLE_SHEETS_API_KEY;

  if (!apiKey) {
    console.log("[Google Sheets] API key not configured. Returning empty data.");
    return { headers: [], rows: [] };
  }

  try {
    const range = config.range || "Sheet1!A:Z";
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${range}?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.values && data.values.length > 0) {
      return {
        headers: data.values[0],
        rows: data.values.slice(1),
      };
    }

    return { headers: [], rows: [] };
  } catch (error) {
    console.error("[Google Sheets] Read error:", error);
    return { headers: [], rows: [] };
  }
}

/**
 * Write data to a Google Sheet (requires service account)
 * Placeholder implementation
 */
export async function writeToSheet(
  config: SheetConfig,
  data: string[][]
): Promise<{ success: boolean; updatedCells?: number; error?: string }> {
  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!serviceEmail || !privateKey) {
    console.log("[Google Sheets] Service account not configured. Would write data.");
    return { success: true, updatedCells: data.length * (data[0]?.length || 0) };
  }

  try {
    // In production, use googleapis:
    // import { google } from 'googleapis';
    // const auth = new google.auth.GoogleAuth({
    //   credentials: { client_email: serviceEmail, private_key: privateKey },
    //   scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    // });
    // const sheets = google.sheets({ version: 'v4', auth });
    // await sheets.spreadsheets.values.update({
    //   spreadsheetId: config.spreadsheetId,
    //   range: config.range || 'Sheet1!A1',
    //   valueInputOption: 'RAW',
    //   requestBody: { values: data },
    // });

    console.log(`[Google Sheets] Would write ${data.length} rows to sheet ${config.spreadsheetId}`);
    return { success: true, updatedCells: data.length * (data[0]?.length || 0) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Write failed",
    };
  }
}

/**
 * Parse Google Sheets URL to extract spreadsheet ID
 */
export function parseSheetUrl(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Convert sheet rows to objects using headers
 */
export function rowsToObjects(headers: string[], rows: string[][]): Record<string, string>[] {
  return rows.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      obj[header.toLowerCase().replace(/\s+/g, "_")] = row[idx] || "";
    });
    return obj;
  });
}
