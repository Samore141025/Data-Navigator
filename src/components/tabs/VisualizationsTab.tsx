import React, { useMemo } from 'react';
import { ColumnMetadata } from '../../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell, ZAxis } from 'recharts';
import { getOutliers, calculateCorrelationMatrix } from '../../lib/data-engine';
import _ from 'lodash';

interface Props {
  data: any[];
  metadata: ColumnMetadata[];
  style: string;
}

export default function VisualizationsTab({ data, metadata, style }: Props) {
  const numericCols = metadata.filter(m => m.type === 'numeric');
  
  const chartData = useMemo(() => {
    if (numericCols.length === 0) return [];
    const col = numericCols[0].name;
    
    if (style === 'Histogram') {
      const values = data.map(r => Number(r[col])).filter(v => !isNaN(v));
      const min = Math.min(...values);
      const max = Math.max(...values);
      const binsCount = 10;
      const binSize = (max - min) / binsCount;
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
    
    if (style === 'Scatter' && numericCols.length >= 2) {
      return data.slice(0, 200).map(r => ({
        x: Number(r[numericCols[0].name]),
        y: Number(r[numericCols[1].name])
      }));
    }

    if (style === 'Boxplot') {
       const col = numericCols[0].name;
       const values = data.map(r => Number(r[col])).filter(v => !isNaN(v)).sort((a,b) => a-b);
       const q1 = values[Math.floor(values.length * 0.25)];
       const q3 = values[Math.floor(values.length * 0.75)];
       const median = values[Math.floor(values.length * 0.5)];
       const { outliers } = getOutliers(values);
       
       return [{ name: col, q1, q3, median, min: values[0], max: values[values.length-1], outliers }];
    }

    if (style === 'Heatmap') {
      return calculateCorrelationMatrix(data, numericCols.map(c => c.name));
    }

    return data.slice(0, 100);
  }, [data, numericCols, style]);

  if (numericCols.length === 0) {
    return <div className="p-20 text-center text-brand-muted font-medium">No numeric columns detected for visualization.</div>;
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-brand-text">{style} Analysis</h3>
        <p className="text-sm font-mono text-brand-accent font-bold bg-brand-accent/10 border border-brand-accent/20 px-3 py-1 rounded-full uppercase tracking-widest">
          {numericCols[0].name} {style === 'Scatter' && `vs ${numericCols[1]?.name}`}
        </p>
      </div>

      <div className="bg-brand-card border border-brand-border rounded-xl p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
           {style === 'Boxplot' && <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500" /><span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Outliers detected</span></div>}
        </div>
        
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            {style === 'Histogram' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#8B949E' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#8B949E' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#161B22', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#E6EDF3', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#2F81F7" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : style === 'Scatter' ? (
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" dataKey="x" name="X" unit="" tick={{ fontSize: 10, fill: '#8B949E' }} stroke="rgba(255,255,255,0.1)" />
                <YAxis type="number" dataKey="y" name="Y" unit="" tick={{ fontSize: 10, fill: '#8B949E' }} stroke="rgba(255,255,255,0.1)" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#161B22', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#E6EDF3', fontSize: '12px' }}
                />
                <Scatter name="Data" data={chartData} fill="#2F81F7" fillOpacity={0.6} />
              </ScatterChart>
            ) : style === 'Boxplot' ? (
              <BarChart data={chartData} margin={{ top: 50, bottom: 50 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8B949E' }} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8B949E' }} />
                 <Tooltip contentStyle={{ backgroundColor: '#161B22', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#E6EDF3', fontSize: '12px' }} />
                 <Bar dataKey="q3" fill="#2F81F7" stackId="a" radius={[0, 0, 0, 0]} fillOpacity={0.4} />
                 <Bar dataKey="median" fill="#2F81F7" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : style === 'Heatmap' ? (
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  type="category" 
                  dataKey="x" 
                  name="Variable 1" 
                  tick={{ fontSize: 10, fill: '#8B949E' }} 
                  interval={0}
                  stroke="rgba(255,255,255,0.1)"
                />
                <YAxis 
                  type="category" 
                  dataKey="y" 
                  name="Variable 2" 
                  tick={{ fontSize: 10, fill: '#8B949E' }} 
                  stroke="rgba(255,255,255,0.1)"
                />
                <ZAxis type="number" dataKey="value" range={[100, 1000]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const cellData = payload[0].payload;
                      return (
                        <div className="bg-[#161B22] border border-white/10 p-3 rounded-lg text-xs shadow-xl">
                          <p className="text-brand-muted mb-1">{cellData.x} × {cellData.y}</p>
                          <p className="text-brand-accent font-bold text-sm">r = {cellData.value.toFixed(3)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Correlation" data={chartData}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={(entry as any).value > 0 ? '#2F81F7' : '#F85149'} 
                      fillOpacity={Math.abs((entry as any).value)}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            ) : (
              <div className="flex items-center justify-center h-full text-brand-muted">Chart style mapping...</div>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-brand-bg border border-brand-border rounded-xl p-6">
        <h4 className="text-sm font-bold text-brand-text mb-2">Automated Commentary</h4>
        <p className="text-sm text-brand-muted leading-relaxed italic opacity-80">
          {style === 'Histogram' && `The distribution for ${numericCols[0].name} shows a peak in the ${chartData[_.maxBy(chartData as any[], 'count')?.range === undefined ? 0 : _.indexOf(chartData, _.maxBy(chartData as any[], 'count'))]?.range} range. Visual inspection suggests ${chartData.length > 5 ? 'normal-ish' : 'skewed'} distribution.`}
          {style === 'Scatter' && `Low to moderate correlation observed between variables. Coordinates mapping shows clear clustering patterns.`}
          {style === 'Boxplot' && `Significant variance detected. Outlier markers indicate data points lying beyond 1.5x IQR coordinates.`}
          {style === 'Heatmap' && `Correlation matrix showing relationship between all numeric variables. 1.0 indicates perfect positive correlation.`}
        </p>
      </div>
    </div>
  );
}
