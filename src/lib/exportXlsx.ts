import ExcelJS from 'exceljs';

export async function exportToXlsx(filename: string, sheets: Record<string, Array<Record<string, any>>>) {
  const wb = new ExcelJS.Workbook();
  Object.entries(sheets).forEach(([name, rows]) => {
    const ws = wb.addWorksheet(name.slice(0, 31));
    if (rows.length === 0) return;
    const columns = Object.keys(rows[0]);
    ws.columns = columns.map((key) => ({ header: key, key }));
    rows.forEach((row) => ws.addRow(row));
  });
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
