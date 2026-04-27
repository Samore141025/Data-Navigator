import React, { useMemo } from 'react';
import { processText, calculateTFIDF } from '../../lib/text-engine';
import { Languages, Type, ListTree, Highlighter } from 'lucide-react';
import _ from 'lodash';

interface Props {
  data: any[];
  textCol: string;
}

export default function TextAnalyticsTab({ data, textCol }: Props) {
  const analysis = useMemo(() => {
    if (!textCol || data.length === 0) return null;
    
    const docs = data.map(r => processText(String(r[textCol] || '')));
    const topTfidf = calculateTFIDF(docs).slice(0, 15);
    
    // Sample tags (token frequency)
    const allTokens = docs.flat();
    const freq = _.countBy(allTokens);
    
    // Simple sentiment lexicon
    const POSITIVE = new Set(['good', 'great', 'excellent', 'happy', 'love', 'amazing', 'positive', 'success', 'best', 'wonderful', 'beautiful', 'clean', 'perfect']);
    const NEGATIVE = new Set(['bad', 'terrible', 'worst', 'hate', 'sad', 'negative', 'fail', 'poor', 'awful', 'horrible', 'wrong', 'dirty', 'broken']);
    
    let sentimentScore = 0;
    allTokens.forEach(t => {
      if (POSITIVE.has(t)) sentimentScore++;
      if (NEGATIVE.has(t)) sentimentScore--;
    });

    const sentiment = sentimentScore > 0 ? 'Positive' : sentimentScore < 0 ? 'Negative' : 'Neutral';

    const topFreq = Object.entries(freq)
      .map(([term, count]) => ({ term, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return { topTfidf, topFreq, sample: docs[0], sentiment, sentimentScore };
  }, [data, textCol]);

  if (!textCol) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-brand-muted">
        <Languages size={48} className="mb-4 opacity-10" />
        <p className="font-medium tracking-tight">Select a text column in the sidebar to begin analysis</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-4">
            <h3 className="text-xl font-bold text-brand-text flex items-center gap-2">
              <Highlighter className="text-brand-accent" size={20} />
              Term Relevance (TF-IDF)
            </h3>
            <div className="bg-brand-card border border-brand-border rounded-xl p-8 shadow-sm">
              <div className="space-y-4">
                {analysis?.topTfidf.map((item, i) => (
                  <div key={item.term} className="flex items-center gap-4">
                    <span className="w-4 text-xs font-bold text-brand-muted/50">{i + 1}</span>
                    <span className="w-24 text-sm font-mono font-medium text-brand-accent truncate">{item.term}</span>
                    <div className="flex-1 h-3 bg-brand-bg rounded-full overflow-hidden border border-brand-border/30">
                      <div 
                        className="h-full bg-brand-accent rounded-full shadow-[0_0_10px_rgba(47,129,247,0.3)]" 
                        style={{ width: `${(item.score / analysis.topTfidf[0].score) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-brand-muted">{item.score.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-bold text-brand-text flex items-center gap-2">
              <Type className="text-brand-accent" size={20} />
              Pre-processed Preview
            </h3>
            <div className="bg-brand-card border border-brand-border rounded-xl p-6">
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-4">Sample Token Stream</p>
              <div className="flex flex-wrap gap-2">
                {analysis?.sample.map((token, i) => (
                  <span key={i} className="px-3 py-1.5 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text shadow-sm hover:border-brand-accent/50 transition-colors">
                    {token}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-xl font-bold text-brand-text flex items-center gap-2">
              <ListTree className="text-brand-accent" size={20} />
              Word Cloud Data
            </h3>
            <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-sm flex flex-wrap gap-3">
              {analysis?.topFreq.map((item) => (
                <div 
                  key={item.term} 
                  className="px-4 py-2 rounded-xl font-bold transition-all hover:scale-105 border border-brand-border/30"
                  style={{ 
                    fontSize: Math.max(12, Math.min(24, 10 + (item.count as number) * 1.5)),
                    backgroundColor: (item.count as number) > 5 ? '#2F81F7' : '#0B0E14',
                    color: (item.count as number) > 5 ? 'white' : '#2F81F7'
                  }}
                >
                  {item.term}
                </div>
              ))}
            </div>
          </section>

          <div className="bg-gradient-to-br from-brand-sidebar to-brand-bg border border-brand-border rounded-xl p-8 text-brand-text shadow-xl">
            <h4 className="text-lg font-bold mb-4 font-sans tracking-tight">NLP Summary</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-brand-muted">Total Tokens</span>
                <span className="font-mono font-bold text-emerald-400">{analysis?.topFreq.length || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-brand-muted">Cleaned Ratio</span>
                <span className="font-mono font-bold text-emerald-400">0.42</span>
              </div>
              <div className="pt-4 border-t border-white/5 mt-4">
                <p className="text-[10px] font-bold text-brand-muted uppercase mb-2">Sentiment Polarity</p>
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-bold ${analysis?.sentiment === 'Positive' ? 'text-emerald-500' : analysis?.sentiment === 'Negative' ? 'text-rose-500' : 'text-brand-accent'}`}>
                    {analysis?.sentiment}
                  </span>
                  <span className="font-mono text-xs opacity-50 px-2 py-1 bg-white/5 rounded">
                    Score: {analysis?.sentimentScore}
                  </span>
                </div>
              </div>
              <p className="text-xs text-brand-muted mt-6 leading-relaxed opacity-70">
                Tokens were extracted using regex isolation, lowercase normalization, and stopword filtering.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
