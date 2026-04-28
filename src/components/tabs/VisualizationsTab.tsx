import React, { useMemo } from 'react';
import { ColumnMetadata } from '../../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell, ZAxis } from 'recharts';
import { getOutliers } from '../../lib/data-engine';
import { cn } from '../../lib/utils';
import { BarChart3 } from 'lucide-react';
import _ from 'lodash';

interface Props {
  data: any[];
  metadata: ColumnMetadata[];
  style: string;
  selectedX: string;
  selectedY: string;
  setVizStyle: (s: string) => void;
  setSelectedX: (s: string) => void;
  setSelectedY: (s: string) => void;
}

export default function VisualizationsTab({ 
  data, metadata, style, selectedX, selectedY,
  setVizStyle, setSelectedX, setSelectedY 
}: Props) {
  const numericCols = metadata.filter(m => m.type === 'numeric');
  
  const chartData = useMemo(() => {
    if (!selectedX && numericCols.length > 0) return [];
    
    if (style === 'Histogram') {
      const values = data.map(r => Number(r[selectedX])).filter(v => !isNaN(v));
      if (values.length === 0) return [];
      const min = _.min(values) || 0;
      const max = _.max(values) || 100;
      const binsCount = 10;
      const binSize = (max - min) / binsCount || 1;
      const bins = Array.from({ length: binsCount }, (_, i) => ({
        range: `${(min + i * binSize).toFixed(1)} - ${(min + (i + 1) * binSize).toFixed(1)}`,
        count: 0
      }));
      values.forEach(v => {
        const idx = Math.min(binsCount - 1, Math.floor((v - min) / binSize));
        if (idx >= 0) bins[idx].count++;
      });
      return bins;
    }
    
    if (style === 'Scatter') {
      const xKey = selectedX;
      const yKey = selectedY;
      if (!xKey || !yKey) return [];
      return data.slice(0, 500).map(r => ({
        x: Number(r[xKey]),
        y: Number(r[yKey]),
      })).filter(d => !isNaN(d.x) && !isNaN(d.y));
    }

    if (style === 'Boxplot') {
       const values = data.map(r => Number(r[selectedX])).filter(v => !isNaN(v)).sort((a,b) => a-b);
       if (values.length === 0) return [];
       const q1 = values[Math.floor(values.length * 0.25)];
       const q3 = values[Math.floor(values.length * 0.75)];
       const median = values[Math.floor(values.length * 0.5)];
       const min = values[0];
       const max = values[values.length - 1];
       
       return [{ 
         name: selectedX, 
         min,
         q1: q1 - min, 
         q2: median - q1, 
         q3: q3 - median,
         max: max - q3,
         actualMin: min,
         actualQ1: q1,
         actualMedian: median,
         actualQ3: q3,
         actualMax: max
       }];
    }

    return [];
  }, [data, numericCols, style, selectedX, selectedY]);

  if (numericCols.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
        <div className="w-16 h-16 bg-brand-accent/5 rounded-full flex items-center justify-center text-brand-accent italic">
          !
        </div>
        <div>
          <h3 className="text-lg font-bold text-brand-text">Insufficient Data</h3>
          <p className="text-sm text-brand-muted max-w-xs mx-auto">
            Numerical columns are required for visualization. Try checking your data types in the Wrangling tab.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-brand-sidebar/30 p-6 rounded-2xl border border-brand-border/40">
        <div className="space-y-4">
          <div>
            <span className="text-[10px] font-bold text-brand-accent uppercase tracking-widest mb-1 block">Analytics Dashboard</span>
            <h3 className="text-2xl font-black text-brand-text tracking-tight uppercase flex items-center gap-3">
               {style} 
               <span className="text-brand-muted font-light">/</span>
               <span className="text-brand-accent truncate max-w-[200px]">{selectedX}</span>
               {style === 'Scatter' && <><span className="text-brand-muted font-light">vs</span> <span className="text-brand-accent truncate max-w-[200px]">{selectedY}</span></>}
            </h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-muted uppercase">Chart Type</label>
              <select value={style} onChange={e => setVizStyle(e.target.value)} className="block bg-brand-bg border border-brand-border rounded px-2 py-1 text-[11px] font-bold focus:border-brand-accent outline-none">
                {['Histogram', 'Boxplot', 'Scatter'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {(style === 'Histogram' || style === 'Boxplot' || style === 'Scatter') && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-muted uppercase">{style === 'Scatter' ? 'X Axis' : 'Variable'}</label>
                <select value={selectedX} onChange={e => setSelectedX(e.target.value)} className="block bg-brand-bg border border-brand-border rounded px-2 py-1 text-[11px] font-bold focus:border-brand-accent outline-none">
                  {numericCols.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                </select>
              </div>
            )}
            {style === 'Scatter' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-muted uppercase">Y Axis</label>
                <select value={selectedY} onChange={e => setSelectedY(e.target.value)} className="block bg-brand-bg border border-brand-border rounded px-2 py-1 text-[11px] font-bold focus:border-brand-accent outline-none">
                  {numericCols.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 self-start md:self-auto">
           <div className="px-3 py-1 bg-brand-accent/10 border border-brand-accent/20 rounded-md">
              <span className="text-[10px] font-mono text-brand-accent font-bold uppercase">Rows: {data.length}</span>
           </div>
           <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-md">
              <span className="text-[10px] font-mono text-brand-muted font-bold uppercase italic tracking-tighter">Internal Engine 4.2</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-brand-card border border-brand-border rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-transparent pointer-events-none" />
          
          <div className="h-[550px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              {style === 'Histogram' ? (
                <BarChart data={chartData}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2F81F7" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#2F81F7" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis 
                    dataKey="range" 
                    tick={{ fontSize: 10, fill: '#8B949E' }} 
                    axisLine={false} 
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#8B949E' }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{ backgroundColor: '#0D1117', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#E6EDF3', fontSize: '11px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#2F81F7', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={50} />
                </BarChart>
              ) : style === 'Scatter' ? (
                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name={selectedX} 
                    tick={{ fontSize: 10, fill: '#8B949E' }} 
                    stroke="rgba(255,255,255,0.1)"
                    axisLine={false}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name={selectedY} 
                    tick={{ fontSize: 10, fill: '#8B949E' }} 
                    stroke="rgba(255,255,255,0.1)"
                    axisLine={false}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3', stroke: '#2F81F7' }}
                    contentStyle={{ backgroundColor: '#0D1117', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#E6EDF3', fontSize: '11px' }}
                  />
                  <Scatter name="Data Point" data={chartData} fill="#2F81F7" fillOpacity={0.5} stroke="#2F81F7" strokeWidth={1} />
                </ScatterChart>
              ) : style === 'Boxplot' ? (
                <BarChart data={chartData} margin={{ top: 50, bottom: 50 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8B949E', fontSize: 12, fontWeight: 'bold' }} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8B949E', fontSize: 10 }} />
                   <Tooltip 
                    cursor={false}
                    contentStyle={{ backgroundColor: '#0D1117', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#E6EDF3', fontSize: '11px' }}
                    formatter={(value, name, props) => {
                      const p = props.payload;
                      if (name === 'min') return [p.actualMin, 'Minimum'];
                      if (name === 'q1') return [p.actualQ1, 'Q1'];
                      if (name === 'q2') return [p.actualMedian, 'Median'];
                      if (name === 'q3') return [p.actualQ3, 'Q3'];
                      if (name === 'max') return [p.actualMax, 'Maximum'];
                      return [value, name];
                    }}
                    itemStyle={{ padding: '2px 0' }}
                   />
                   <Bar dataKey="min" stackId="box" fill="transparent" />
                   <Bar dataKey="q1" stackId="box" fill="transparent" stroke="#8B949E" strokeWidth={1} />
                   <Bar dataKey="q2" stackId="box" fill="#2F81F7" fillOpacity={0.4} stroke="#2F81F7" strokeWidth={2} />
                   <Bar dataKey="q3" stackId="box" fill="#2F81F7" fillOpacity={0.4} stroke="#2F81F7" strokeWidth={2} />
                   <Bar dataKey="max" stackId="box" fill="transparent" stroke="#8B949E" strokeWidth={1} />
                </BarChart>
              ) : (
                <div className="flex items-center justify-center h-full">
                   <div className="animate-pulse text-brand-muted">Resolving coordinates...</div>
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-sm">
            <h4 className="text-[11px] font-black text-brand-muted uppercase tracking-wider mb-4 border-b border-brand-border pb-2 flex items-center justify-between">
              Statistics Overview
              <BarChart3 size={12} />
            </h4>
            <div className="space-y-4">
              <StatItem label="N-Observations" value={data.length.toLocaleString()} />
              {style === 'Histogram' && (
                <>
                  <StatItem label="Mean" value={_.mean(data.map(r => Number(r[selectedX])).filter(v => !isNaN(v))).toFixed(2)} />
                  <StatItem label="Range" value={chartData.length > 0 ? chartData[chartData.length-1].range.split(' - ')[1] : 'N/A'} />
                </>
              )}
              {style === 'Scatter' && (
                <StatItem label="Complexity" value={chartData.length >= 500 ? "High Density" : "Standard"} />
              )}
            </div>
          </div>

          <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-2xl p-6">
            <h4 className="text-[11px] font-black text-brand-accent uppercase tracking-wider mb-3">Narrative Insight</h4>
            <p className="text-sm text-brand-text leading-relaxed font-medium">
              {style === 'Histogram' && `The feature ${selectedX} displays a ${chartData.length > 5 ? 'multi-modal' : 'concentrated'} distribution. Most observations cluster in the middle ranges.`}
              {style === 'Scatter' && `Projecting ${selectedX} against ${selectedY} reveals the inherent structure of the dataset. Relationships appear ${chartData.length > 100 ? 'stochastic with underlying patterns' : 'defined'}.`}
              {style === 'Boxplot' && `Visualizing quartiles for ${selectedX} identifies central tendency. The 'whisker' range encapsulates bulk behavior.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center group">
      <span className="text-xs text-brand-muted font-medium group-hover:text-brand-text transition-colors">{label}</span>
      <span className="text-sm text-brand-accent font-black tracking-tighter">{value}</span>
    </div>
  );
}

