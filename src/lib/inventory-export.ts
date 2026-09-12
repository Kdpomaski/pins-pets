import { format } from 'date-fns';
import type { InventoryItem } from '@/lib/store';

export type InventoryExportFormat = 'csv' | 'text';

export type InventoryExportOptions = {
  petName?: string;
};

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Capacitor WebView: <a download> is a no-op — write + share the file instead. */
async function shareOrDownload(content: string, filename: string, mime: string): Promise<void> {
  const { Capacitor } = await import('@capacitor/core');
  if (!Capacitor.isNativePlatform()) {
    downloadBlob(content, filename, mime);
    return;
  }

  const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
    import('@capacitor/filesystem'),
    import('@capacitor/share'),
  ]);

  const written = await Filesystem.writeFile({
    path: filename,
    data: content,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });

  await Share.share({
    title: filename,
    url: written.uri,
    dialogTitle: 'Export inventory',
  });
}

function csvEscape(value: string | number | boolean | undefined | null): string {
  if (value == null) return '';
  const raw = String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function activeInventory(items: InventoryItem[]): InventoryItem[] {
  return items.filter((item) => !item.deletedAt);
}

export function buildInventoryCsv(items: InventoryItem[], options?: InventoryExportOptions): string {
  const rows = activeInventory(items);
  const header = [
    'name',
    'form',
    'med_type',
    'concentration',
    'unit',
    'total_quantity',
    'remaining_quantity',
    'frequency',
    'default_dose',
    'lot_number',
    'reconstituted_at',
    'pet',
    'color',
    'id',
  ];

  const body = rows.map((item) =>
    [
      csvEscape(item.name),
      csvEscape(item.form),
      csvEscape(item.medType ?? ''),
      csvEscape(item.concentration ?? ''),
      csvEscape(item.unit),
      csvEscape(item.totalVolume),
      csvEscape(item.remainingVolume),
      csvEscape(item.frequency ?? ''),
      csvEscape(item.defaultDose ?? ''),
      csvEscape(item.lotNumber ?? ''),
      csvEscape(item.reconstitutedAt ?? ''),
      csvEscape(options?.petName ?? ''),
      csvEscape(item.color),
      csvEscape(item.id),
    ].join(','),
  );

  return [header.join(','), ...body].join('\n');
}

export function buildInventoryText(items: InventoryItem[], options?: InventoryExportOptions): string {
  const rows = activeInventory(items);
  const petLabel = options?.petName ? `Pet: ${options.petName}` : 'Pet: (none selected)';
  const header = [
    'PINS PETS — Inventory Export',
    `Exported: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
    petLabel,
    `Items: ${rows.length}`,
    '',
  ];

  if (rows.length === 0) {
    return [...header, 'No inventory items to export for this pet.'].join('\n');
  }

  const body = rows.map((item, index) => {
    const lines = [
      `${index + 1}. ${item.name} (${item.form}${item.medType ? ` · ${item.medType}` : ''})`,
    ];
    if (item.form === 'vial' && item.concentration != null) {
      lines.push(`   Conc: ${item.concentration} ${item.unit}/ml`);
      lines.push(`   Volume: ${item.remainingVolume} / ${item.totalVolume} ml`);
    } else {
      lines.push(`   Quantity: ${item.remainingVolume} / ${item.totalVolume} ${item.unit}`);
    }
    if (item.frequency) lines.push(`   Frequency: ${item.frequency}`);
    if (item.defaultDose != null) lines.push(`   Default dose: ${item.defaultDose} ${item.unit}`);
    if (item.lotNumber) lines.push(`   Lot: ${item.lotNumber}`);
    if (item.form === 'vial') {
      if (item.reconstitutedAt) {
        lines.push(`   Reconstituted: ${format(new Date(item.reconstitutedAt), 'yyyy-MM-dd')}`);
      } else {
        lines.push('   Reconstituted: not yet');
      }
    }
    return lines.join('\n');
  });

  return [...header, ...body].join('\n');
}

export async function exportInventory(
  formatType: InventoryExportFormat,
  items: InventoryItem[],
  options?: InventoryExportOptions,
): Promise<void> {
  const rows = activeInventory(items);
  const stamp = format(new Date(), 'yyyy-MM-dd');
  const petStamp = options?.petName
    ? `-${options.petName.toLowerCase().replace(/\s+/g, '-')}`
    : '';

  if (formatType === 'csv') {
    await shareOrDownload(
      buildInventoryCsv(rows, options),
      `pins-pets-inventory${petStamp}-${stamp}.csv`,
      'text/csv;charset=utf-8',
    );
    return;
  }

  await shareOrDownload(
    buildInventoryText(rows, options),
    `pins-pets-inventory${petStamp}-${stamp}.txt`,
    'text/plain;charset=utf-8',
  );
}
