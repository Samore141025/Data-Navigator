import React, { useState, useMemo } from 'react';
import { ColumnMetadata, ModelMetrics } from '../../types';
import { prepareData, trainLinearRegression, trainLogisticRegression, trainNaiveBayes, trainKMeans } from '../../lib/ml-engine';
import { Brain, Cpu, TrendingUp, Grid3X3, Zap, Layers } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Cell } from 'recharts';

interface Props {
  data: any[];
  metadata: ColumnMetadata[];
  targetNumeric: string;
  targetBinary: string;
  targetMulti: string;
}

export default function ModelsTab({ data, metadata, targetNumeric, targetBinary, targetMulti }: Props) {
  const [results, setResults] = useState<ModelMetrics[]>([]);
  const [isTraining, setIsTraining] = useState(false);

  const handleTrain = () => {
    setIsTraining(true);
    setTimeout(() => {
      const newResults: ModelMetrics[] = [];
      const features = metadata.filter(m => m.type === 'numeric' && m.name !== targetNumeric && m.name !== targetBinary).map(m => m.name);

      if (targetNumeric && features.length > 0) {
        const { X, y } = prepareData(data, targetNumeric, features, 'numeric');
        newResults.push(trainLinearRegression(X, y as number[]));
      }

      if (targetBinary && features.length > 0) {
        const { X, y } = prepareData(data, targetBinary, features, 'binary');
        try {
          newResults.push(trainLogisticRegression(X, y as number[]));
        } catch (e) {
          console.error("Logistic Ref failed", e);
        }
      }

      if (targetMulti && features.length > 0) {
        const { X, y } = prepareData(data, targetMulti, features, 'multiclass');
        newResults.push(trainNaiveBayes(X, y as number[]));
      }

      // Unsupervised: K-Means clustering (available if numeric features exist)
      if (features.length >= 2) {
        const { X } = prepareData(data, '', features, 'numeric');
        newResults.push(trainKMeans(X, 3));
      }

      setResults(newResults);
      setIsTraining(false);
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-brand-text">Predictive Modeling</h2>
          <p className="text-sm text-brand-muted">Auto-training 80/20 train-test split for regression and classification.</p>
        </div>
        <button 
          onClick={handleTrain}
          disabled={isTraining}
          className="bg-brand-accent text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg active:scale-95 disabled:opacity-50"
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
            </div>

            {res.confusionMatrix && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-brand-muted uppercase tracking-widest flex items-center gap-2">
                  <Grid3X3 size={14} /> Confusion Matrix
                </p>
                <div className="grid gap-1">
                  {res.confusionMatrix.map((row, i) => (
                    <div key={i} className="flex gap-1 h-12">
                      {row.map((val, j) => (
                        <div 
                          key={j} 
                          className="flex-1 rounded-lg flex items-center justify-center font-mono text-sm border border-brand-border/50"
                          style={{ backgroundColor: `rgba(47, 129, 247, ${Math.max(0.05, val / (Math.max(...row) || 1))})`, color: val > 0 ? '#E6EDF3' : '#8B949E' }}
                        >
                          {val}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
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
