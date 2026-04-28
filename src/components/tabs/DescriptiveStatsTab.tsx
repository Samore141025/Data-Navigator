import React, { useMemo } from 'react';
import { ColumnMetadata } from '../../types';
import { calculateSummary } from '../../lib/data-engine';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';
import _ from 'lodash';

interface Props {
  data: any[];
  metadata: ColumnMetadata[];
}

export default function DescriptiveStatsTab({ data, metadata }: Props) {
  const numericCols = metadata.filter(m => m.type === 'numeric');
  const categoricalCols = metadata.filter(m => m.type === 'categorical');

  const summary = useMemo(() => {
    return numericCols.map(col => ({
      name: col.name,
      ...calculateSummary(data.map(r => Number(r[col.name])).filter(v => !isNaN(v)))
    }));
  }, [data, numericCols]);

  const groupStats = useMemo(() => {
    if (categoricalCols.length === 0 || numericCols.length === 0) return null;
    const cat = categoricalCols[0].name;
    const num = numericCols[0].name;
    const groups = _.groupBy(data, cat);
    return Object.entries(groups).map(([val, rows]) => ({
      group: val,
      mean: _.mean((rows as any[]).map(r => Number(r[num])).filter(v => !isNaN(v)))
    })).slice(0, 10);
  }, [data, numericCols, categoricalCols]);

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-brand-text">Numerical Summary</h3>
        <div className="bg-brand-card border border-brand-border rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-white/2 border-b border-brand-border">
                <th className="px-5 py-3 font-semibold text-brand-muted uppercase tracking-wider">Feature</th>
                <th className="px-5 py-3 font-semibold text-brand-muted uppercase tracking-wider text-right">Mean</th>
                <th className="px-5 py-3 font-semibold text-brand-muted uppercase tracking-wider text-right">Median</th>
                <th className="px-5 py-3 font-semibold text-brand-muted uppercase tracking-wider text-right">Min</th>
                <th className="px-5 py-3 font-semibold text-brand-muted uppercase tracking-wider text-right">Max</th>
                <th className="px-5 py-3 font-semibold text-brand-muted uppercase tracking-wider text-right">Std Dev</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/50">
              {summary.map((s) => (
                <tr key={s.name} className="hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4 font-mono font-medium text-brand-accent">{s.name}</td>
                  <td className="px-5 py-4 text-right text-brand-text">{s.mean.toFixed(2)}</td>
                  <td className="px-5 py-4 text-right text-brand-text">{s.median.toFixed(2)}</td>
                  <td className="px-5 py-4 text-right text-brand-text">{s.min.toFixed(2)}</td>
                  <td className="px-5 py-4 text-right text-brand-text">{s.max.toFixed(2)}</td>
                  <td className="px-5 py-4 text-right text-brand-text">{s.std.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {groupStats && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-brand-card border border-brand-border rounded-lg p-6 flex flex-col">
            <h3 className="card-title text-brand-text">Comparison Analysis</h3>
            <p className="text-xs text-brand-muted mb-6">
              Mean of <span className="font-bold text-brand-accent">{numericCols[0].name}</span> grouped by <span className="font-bold text-brand-accent">{categoricalCols[0].name}</span>.
            </p>
            <div className="flex-1 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="group" tick={{ fontSize: 10, fill: '#8B949E' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#8B949E' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ backgroundColor: '#161B22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}
                  />
                  <Bar dataKey="mean" radius={[2, 2, 0, 0]}>
                    {groupStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={'#2F81F7'} fillOpacity={0.8 - (index * 0.05)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-brand-card border border-brand-border rounded-lg p-6">
               <h3 className="card-title text-brand-text">Insights Engine</h3>
               <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white/2 border border-brand-border rounded p-4">
                    <p className="text-[10px] font-bold text-brand-muted uppercase mb-1">Max Performing Group</p>
                    <p className="text-xl font-bold text-brand-text truncate">
                      {_.maxBy(groupStats, 'mean')?.group || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white/2 border border-brand-border rounded p-4">
                    <p className="text-[10px] font-bold text-brand-muted uppercase mb-1">Normalized Range</p>
                    <p className="text-xl font-bold text-brand-success">
                      {ss_range(summary.map(s => s.mean)).toFixed(2)}
                    </p>
                  </div>
               </div>
            </div>

            <div className="bg-brand-sidebar border border-brand-border rounded-lg p-6">
               <p className="text-xs text-brand-muted leading-relaxed italic">
                 Automated variance analysis of the first categorical split suggests {groupStats.length > 5 ? 'high granularity' : 'concentrated grouping'} within the target distribution.
               </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function ss_range(values: number[]) {
  if (values.length === 0) return 0;
  return Math.max(...values) - Math.min(...values);
}
