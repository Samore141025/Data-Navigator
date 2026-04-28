import React, { useState, useMemo } from 'react';
import { ColumnMetadata, ModelMetrics } from '../../types';
import { prepareData, trainLinearRegression, trainKMeans } from '../../lib/ml-engine';
import { Brain, Cpu, TrendingUp, Grid3X3, Zap, Layers } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Cell } from 'recharts';

interface Props {
  data: any[];
  metadata: ColumnMetadata[];
  targetNumeric: string;
  targetBinary: string;
  setTargetNumeric: (s: string) => void;
  setTargetBinary: (s: string) => void;
}

export default function ModelsTab({ 
  data, metadata, targetNumeric, targetBinary,
  setTargetNumeric, setTargetBinary 
}: Props) {
  const [results, setResults] = useState<ModelMetrics[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingSize, setTrainingSize] = useState(0);

  const handleTrain = () => {
    setIsTraining(true);
    setTimeout(() => {
      const newResults: ModelMetrics[] = [];
      const features = metadata.filter(m => m.type === 'numeric' && m.name !== targetNumeric && m.name !== targetBinary).map(m => m.name);

      let lastSize = 0;
      if (targetNumeric && features.length > 0) {
        const { X, y } = prepareData(data, targetNumeric, features, 'numeric');
        lastSize = X.length;
        newResults.push(trainLinearRegression(X, y as number[]));
      }

      // Unsupervised: K-Means clustering (available if numeric features exist)
      if (features.length >= 2) {
        const { X } = prepareData(data, '', features, 'numeric');
        let comparisonY: number[] | undefined;
        
        // If a binary/categorical target is selected, use it to cross-validate clusters
        if (targetBinary) {
          const { y } = prepareData(data, targetBinary, features, 'binary');
          comparisonY = y;
        }

        lastSize = Math.max(lastSize, X.length);
        newResults.push(trainKMeans(X, comparisonY, 3));
      }

      setTrainingSize(lastSize);
      setResults(newResults);
      setIsTraining(false);
    }, 1000);
  };

  const numericCols = metadata.filter(m => m.type === 'numeric');
  const categoricalCols = metadata.filter(m => m.type === 'categorical');

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-300">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 bg-brand-sidebar/30 p-6 rounded-2xl border border-brand-border/40">
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-brand-text">Predictive Modeling</h2>
            <p className="text-sm text-brand-muted">
              {trainingSize > 0 
                ? `Last training used ${trainingSize} valid observations.` 
                : "Auto-training for regression and classification."}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-muted uppercase">Numeric Target (Regression)</label>
              <select value={targetNumeric} onChange={e => setTargetNumeric(e.target.value)} className="block bg-brand-bg border border-brand-border rounded px-2 py-1 text-[11px] font-bold focus:border-brand-accent outline-none">
                {numericCols.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-muted uppercase">Categorical Target (Class.)</label>
              <select value={targetBinary} onChange={e => setTargetBinary(e.target.value)} className="block bg-brand-bg border border-brand-border rounded px-2 py-1 text-[11px] font-bold focus:border-brand-accent outline-none">
                {categoricalCols.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
              </select>
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleTrain}
          disabled={isTraining}
          className="bg-brand-accent text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg active:scale-95 disabled:opacity-50 h-fit"
        >
          {isTraining ? <Cpu className="animate-spin" size={20} /> : <Zap size={20} />}
          Train All Models
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {results.map((res) => (
          <div key={res.name} className="bg-brand-card border border-brand-border rounded-xl p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-brand-accent/10 rounded-xl text-brand-accent">
                  <Brain size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-brand-text">{res.name}</h3>
                  <p className="text-xs font-bold text-brand-muted uppercase tracking-widest">Model Results</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {res.r2 !== undefined && (
                <div className="bg-brand-bg rounded-xl p-4 border border-brand-border">
                  <p className="text-[10px] font-bold text-brand-muted uppercase mb-1">R-Squared</p>
                  <p className="text-2xl font-mono text-brand-accent">{(res.r2 * 100).toFixed(1)}%</p>
                </div>
              )}
              {res.mse !== undefined && (
                <div className="bg-brand-bg rounded-xl p-4 border border-brand-border">
                  <p className="text-[10px] font-bold text-brand-muted uppercase mb-1">Mean Sq Error</p>
                  <p className="text-2xl font-mono text-brand-text">{res.mse.toFixed(4)}</p>
                </div>
              )}
              {res.accuracy !== undefined && (
                <div className="bg-brand-bg rounded-xl p-4 border border-brand-border">
                  <p className="text-[10px] font-bold text-brand-muted uppercase mb-1">Accuracy</p>
                  <p className="text-2xl font-mono text-emerald-500">{(res.accuracy * 100).toFixed(1)}%</p>
                </div>
              )}
              {res.clusters !== undefined && (
                <div className="bg-brand-bg rounded-xl p-4 border border-brand-border">
                  <p className="text-[10px] font-bold text-brand-muted uppercase mb-1">Clusters (K)</p>
                  <p className="text-2xl font-mono text-brand-accent">{res.clusters}</p>
                </div>
              )}
              {res.inertia !== undefined && (
                <div className="bg-brand-bg rounded-xl p-4 border border-brand-border">
                  <p className="text-[10px] font-bold text-brand-muted uppercase mb-1">Inertia (Sum of Sq.)</p>
                  <p className="text-2xl font-mono text-purple-400">{res.inertia.toLocaleString()}</p>
                </div>
              )}
            </div>

            {res.confusionMatrix && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-brand-muted uppercase tracking-widest flex items-center gap-2">
                    <Grid3X3 size={14} /> {res.name.includes('K-Means') ? 'Cluster Map' : 'Confusion Matrix'}
                  </p>
                  <span className="text-[9px] text-brand-muted uppercase font-bold italic">
                    {res.name.includes('K-Means') ? 'Top: Actual Labels | Left: Clusters' : 'Top: Actual | Left: Predicted'}
                  </span>
                </div>
                <div className="grid gap-1">
                  {res.confusionMatrix.map((row, i) => (
                    <div key={i} className="flex gap-1 h-12">
                      {row.map((val, j) => (
                        <div 
                          key={j} 
                          title={`Actual Category ${j}, Predicted Category ${i}: ${val}`}
                          className="flex-1 rounded-lg flex items-center justify-center font-mono text-sm border border-brand-border/50 transition-all hover:scale-105"
                          style={{ backgroundColor: `rgba(47, 129, 247, ${Math.max(0.05, val / (Math.max(...row) || 1))})`, color: val > 0 ? '#E6EDF3' : '#8B949E' }}
                        >
                          {val}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-brand-muted leading-tight">
                  {res.name.includes('K-Means') 
                    ? 'This map shows the concentration of specific data categories (columns) within your generated clusters (rows).'
                    : 'The matrix shows how many observations were correctly labeled (the diagonal boxes) vs. misclassified (the off-diagonal boxes).'}
                </p>
              </div>
            )}

            {res.name === 'K-Means Clustering' && res.data && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-brand-muted uppercase tracking-widest flex items-center gap-2">
                  <Layers size={14} /> Cluster Distribution
                </p>
                <div className="h-40 bg-black/20 rounded-xl overflow-hidden p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                      <XAxis type="number" dataKey="x" hide />
                      <YAxis type="number" dataKey="y" hide />
                      <ChartTooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name="Clusters" data={res.data}>
                        {(res.data as any[]).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={['#2f81f7', '#7ee787', '#d2a8ff', '#ffa657'][entry.cluster % 4]} 
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[9px] text-brand-muted italic">Visualization of grouped entities based on feature similarity.</p>
              </div>
            )}
          </div>
        ))}

        {results.length === 0 && !isTraining && (
          <div className="lg:col-span-2 border-2 border-dashed border-brand-border rounded-xl p-12 text-center bg-brand-card/30">
            <div className="w-16 h-16 bg-brand-bg rounded-full flex items-center justify-center mx-auto mb-4 text-brand-muted">
              <TrendingUp size={32} />
            </div>
            <p className="text-brand-text font-medium tracking-tight uppercase text-xs">Models have not been initialized</p>
            <p className="text-brand-muted text-sm mt-1">Configure targets in the sidebar and click Train All Models</p>
          </div>
        )}
      </div>
    </div>
  );
}
