export interface CsvResult {
  success: boolean;
  csv?: string;
  error?: string;
}

export function convertJsonToCsv(jsonInput: string, delimiter: string = ','): CsvResult {
  try {
    const data = JSON.parse(jsonInput);
    if (!Array.isArray(data) || data.length === 0) {
      if (Array.isArray(data) && data.length === 0) {
        return { success: true, csv: '' };
      }
      return { success: false, error: 'Input must be a non-empty JSON array of objects' };
    }

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(delimiter));

    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        const escaped = ('' + (val ?? '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(delimiter));
    }

    // Prepend UTF-8 BOM for Excel to recognize Cyrillic correctly
    const csvContent = '\uFEFF' + csvRows.join('\n');

    return { success: true, csv: csvContent };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during CSV conversion',
    };
  }
}
