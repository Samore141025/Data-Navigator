import React from 'react';
import { ColumnMetadata } from '../../types';
import { Database, TrendingDown, Info, Table as TableIcon } from 'lucide-react';

interface Props {
  data: any[];
  original: any[] | null;
  metadata: ColumnMetadata[];
  history: string[];
}

export default function DataWranglingTab({ data, original, metadata, history }: Props) {
  const originalNullCount = original ? original.reduce((acc, row) => {
    Object.values(row).forEach(v => { if (v === null || v === undefined || v === '') acc++; });
    return acc;
  }, 0) : 0;

  const currentNullCount = data.reduce((acc, row) => {
    Object.values(row).forEach(v => { if (v === null || v === undefined || v === '') acc++; });
    return acc;
  }, 0);

  const stats = [
    { label: 'Total Rows', value: data.length.toLocaleString(), icon: Database, color: 'text-brand-accent' },
    { label: 'Total Columns', value: metadata.length, icon: TableIcon, color: 'text-brand-accent' },
    { label: 'Missing Values', value: currentNullCount, icon: Info, color: 'text-brand-success' },
    { label: 'Reduction', value: original ? `${(((originalNullCount - currentNullCount) / (originalNullCount || 1)) * 100).toFixed(1)}%` : '0%', icon: TrendingDown, color: 'text-brand-success' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-brand-card border border-brand-border rounded-lg p-4">
            <div className={`metric-label mb-1 ${stat.color}`}>{stat.label}</div>
            <div className="metric-val text-brand-text">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column Summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-brand-card border border-brand-border rounded-lg p-5">
            <h3 className="card-title text-brand-text">Column Metadata Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-brand-muted uppercase text-[10px] tracking-wider">
                    <th className="py-2 text-left">Feature</th>
                    <th className="py-2 text-left">Data Type</th>
                    <th className="py-2 text-right">Unique</th>
                    <th className="py-2 text-right">Missing</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {metadata.map((col) => (
                    <tr key={col.name} className="border-t border-brand-border/50 hover:bg-white/2 transition-colors">
                      <td className="py-3 font-mono font-medium text-brand-accent">{col.name}</td>
                      <td className="py-3">
                        <span className="text-[10px] font-bold uppercase text-brand-muted opacity-80">{col.type}</span>
                      </td>
                      <td className="py-3 text-right font-mono text-brand-muted">{col.distinctCount}</td>
                      <td className="py-3 text-right">
                        <span className={col.nullCount > 0 ? "text-brand-success" : "text-brand-muted opacity-40"}>
                          {col.nullCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Cleaning Pipeline History */}
        <div className="space-y-4">
          <div className="bg-brand-sidebar border border-brand-border rounded-lg p-5 h-full min-h-[300px]">
             <h3 className="card-title text-brand-text">Data Pipeline Log</h3>
             <div className="space-y-3 font-mono text-[11px] leading-relaxed text-brand-muted">
                {history.length === 0 ? (
                  <div className="italic opacity-30 px-2 py-4 border border-dashed border-brand-border rounded text-center">No transformations queued...</div>
                ) : (
                  history.map((h, i) => (
                    <div key={i} className="flex gap-2">
                       <span className="text-brand-success">{" >> "}</span>
                       <span>{h}</span>
                    </div>
                  ))
                )}
                {history.length > 0 && <div className="text-brand-success pt-4 font-bold">● Sequence finalized</div>}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
