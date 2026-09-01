import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Everything the "Extra" bullet asks for — CSV and PDF export — lives here
 * as small, dependency-free-of-Angular functions so both the table widget
 * and the chart widget can reuse them without duplicating formatting logic.
 */
@Injectable({ providedIn: 'root' })
export class ExportService {
  exportRowsToCsv(filename: string, columns: { key: string; label: string }[], rows: Record<string, unknown>[]): void {
    const header = columns.map((c) => csvEscape(c.label)).join(',');
    const body = rows
      .map((row) => columns.map((c) => csvEscape(row[c.key])).join(','))
      .join('\n');
    const csv = `${header}\n${body}`;
    this.download(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`);
  }

  exportRowsToPdf(title: string, columns: { key: string; label: string }[], rows: Record<string, unknown>[]): void {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(title, 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Generated ${new Date().toLocaleString()}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [columns.map((c) => c.label)],
      body: rows.map((row) => columns.map((c) => String(row[c.key] ?? ''))),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [108, 76, 224] },
    });

    doc.save(`${slugify(title)}.pdf`);
  }

  /** Embeds a chart's rendered PNG (from ECharts' getDataURL()) into a PDF. */
  exportImageToPdf(title: string, dataUrl: string, pixelWidth: number, pixelHeight: number): void {
    const doc = new jsPDF({ orientation: pixelWidth >= pixelHeight ? 'landscape' : 'portrait' });
    doc.setFontSize(14);
    doc.text(title, 14, 16);

    const pageWidth = doc.internal.pageSize.getWidth() - 28;
    const scale = pageWidth / pixelWidth;
    const width = pixelWidth * scale;
    const height = pixelHeight * scale;

    doc.addImage(dataUrl, 'PNG', 14, 24, width, height);
    doc.save(`${slugify(title)}.pdf`);
  }

  private download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}

function csvEscape(value: unknown): string {
  const str = String(value ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
