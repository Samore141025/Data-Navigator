import React, { useState, useMemo } from 'react';
import { Upload, FileText, Database, BarChart3, Binary, LayoutDashboard, Download, Settings2, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import Papa from 'papaparse';
import { ColumnMetadata, ModelMetrics } from './types';
import { getColumnMetadata, cleanData } from './lib/data-engine';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Tabs
import DataWranglingTab from './components/tabs/DataWranglingTab';
import DescriptiveStatsTab from './components/tabs/DescriptiveStatsTab';
import ModelsTab from './components/tabs/ModelsTab';
import TextAnalyticsTab from './components/tabs/TextAnalyticsTab';
import VisualizationsTab from './components/tabs/VisualizationsTab';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[] | null>(null);
  const [originalData, setOriginalData] = useState<any[] | null>(null);
  const [metadata, setMetadata] = useState<ColumnMetadata[]>([]);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleaningHistory, setCleaningHistory] = useState<{message: string, type: 'info' | 'success' | 'warning', time: string}[]>([]);
  const [activeTab, setActiveTab] = useState('wrangling');
  
  // Sidebar Controls
  const [targetNumeric, setTargetNumeric] = useState('');
  const [targetBinary, setTargetBinary] = useState('');
  const [textCol, setTextCol] = useState('');
  const [vizStyle, setVizStyle] = useState('Histogram');
  const [selectedX, setSelectedX] = useState('');
  const [selectedY, setSelectedY] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setCleaningHistory([{ message: "CSV sync initiated: Reading stream...", type: 'info', time: new Date().toLocaleTimeString() }]);
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          setOriginalData(results.data);
          setData(results.data);
          const meta = getColumnMetadata(results.data);
          setMetadata(meta);
          
          // Auto-select targets
          const numericCols = meta.filter(m => m.type === 'numeric');
          const categoricalCols = meta.filter(m => m.type === 'categorical');
          const txtCols = meta.filter(m => m.type === 'text');
          
          if (numericCols.length > 0) {
            setTargetNumeric(numericCols[0].name);
            setSelectedX(numericCols[0].name);
            if (numericCols.length > 1) setSelectedY(numericCols[1].name);
          }
          if (categoricalCols.length > 0) {
            setTargetBinary(categoricalCols[0].name);
          }
          if (txtCols.length > 0) setTextCol(txtCols[0].name);
        }
      });
    }
  };

  const handleClean = () => {
    if (!data) return;
    setIsCleaning(true);
    setTimeout(() => {
      const { cleaned, history: logHistory } = cleanData(data, metadata);
      setData(cleaned);
      setMetadata(getColumnMetadata(cleaned));
      
      const newEntries = logHistory.map(h => ({
        message: h,
        type: (h.startsWith('OPTIMIZE') ? 'success' : 'info') as 'info' | 'success' | 'warning',
        time: new Date().toLocaleTimeString()
      }));
      
      setCleaningHistory(prev => [...newEntries, ...prev]);
      setIsCleaning(false);
    }, 800);
  };

  const handleDownloadReport = () => {
    if (!data) return;
    const reportHtml = `
      <html>
        <head>
          <title>Advanced Data Analysis Report</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #E6EDF3; background-color: #0B0E14; }
            h1 { color: #2F81F7; border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 10px; }
            h2 { color: #8B949E; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid rgba(255,255,255,0.1); padding: 12px; text-align: left; }
            th { background-color: #161B22; }
            .metric { font-weight: bold; color: #2F81F7; }
          </style>
        </head>
        <body>
          <h1>Data Science Analysis Report</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
          
          <h2>1. Data Overview</h2>
          <p>Total Records: <span class="metric">${data.length}</span></p>
          <p>Total Features: <span class="metric">${metadata.length}</span></p>
          
          <h2>2. Column Metadata</h2>
          <table>
            <tr><th>Column</th><th>Type</th><th>Distinct</th><th>Nulls</th></tr>
            ${metadata.map(m => `<tr><td>${m.name}</td><td>${m.type}</td><td>${m.distinctCount}</td><td>${m.nullCount}</td></tr>`).join('')}
          </table>

          <h2>3. Cleaning Log</h2>
          <ul>
            ${cleaningHistory.map(h => `<li>[${h.time}] ${h.message}</li>`).join('')}
          </ul>
          
          <p style="margin-top: 50px; font-size: 12px; color: #8B949E;">Automated Data Science Pipeline</p>
        </body>
      </html>
    `;
    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis_report_${new Date().getTime()}.html`;
    link.click();
  };

  const tabs = [
    { id: 'wrangling', label: 'Data Wrangling', icon: Database },
    { id: 'stats', label: 'Descriptive Stats', icon: FileText },
    { id: 'models', label: 'ML Models', icon: Binary },
    { id: 'text', label: 'Text Analytics', icon: LayoutDashboard },
    { id: 'viz', label: 'Visualizations', icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden font-sans text-brand-text">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-sidebar border-r border-brand-border flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-brand-border">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-brand-accent">Data Navigator</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* File Upload Section */}
          <section>
            <label className="block text-[11px] font-semibold text-brand-muted uppercase mb-2">Input Data</label>
            <div className="relative group">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={cn(
                "border border-dashed rounded-md p-5 transition-all duration-200 flex flex-col items-center justify-center gap-2 text-center",
                file ? "border-brand-success bg-brand-success/5" : "border-brand-border bg-white/2"
              )}>
                {uploadIcon(file)}
                <p className="text-xs font-medium text-brand-text truncate w-full px-2">{file ? file.name : "Select CSV"}</p>
                <p className="text-[10px] text-brand-muted">Max size 100MB</p>
              </div>
            </div>
          </section>

          {/* Configuration Section Removed as requested */}
          {data && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="pt-2">
                <button 
                  onClick={handleClean}
                  disabled={isCleaning}
                  className="w-full bg-brand-accent hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold py-2 rounded transition-all flex items-center justify-center gap-2"
                >
                  {isCleaning ? <Settings2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                  Run Preprocessor
                </button>
              </div>
            </motion.div>
          )}
        </div>

        <div className="p-4 border-t border-brand-border bg-brand-sidebar">
          <button 
            onClick={handleDownloadReport}
            className="w-full text-brand-muted hover:text-brand-accent text-xs font-medium flex items-center justify-center gap-2 border border-brand-border py-2 rounded transition-colors"
          >
            <Download size={14} />
            Generate Report
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-brand-bg">
        <header className="h-14 border-b border-brand-border px-6 flex items-center justify-between bg-brand-bg">
          <div className="text-xs font-medium flex items-center gap-3">
             <span className="flex items-center gap-2">Pipeline Status: <span className="text-brand-success">● Active</span></span>
              <div className="flex gap-2 ml-4">
                <span className="px-1.5 py-0.5 bg-brand-success/15 text-brand-success border border-brand-success/20 rounded text-[9px] font-bold uppercase">Pandas Core 2.0</span>
              </div>
          </div>
          
          {data && (
            <div className="text-right">
              <p className="text-[10px] font-mono font-medium text-brand-muted uppercase">Rows: {data.length.toLocaleString()} | Features: {metadata.length}</p>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="tabs border-b border-brand-border flex px-6 h-12">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 h-full text-sm transition-all border-b-2 flex items-center gap-2",
                  activeTab === tab.id 
                    ? "border-brand-accent text-brand-accent font-semibold" 
                    : "border-transparent text-brand-muted hover:text-brand-text"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {!data ? (
              <div className="h-[70vh] flex flex-col items-center justify-center text-center max-w-lg mx-auto">
                <div className="w-20 h-20 bg-brand-accent/10 border border-brand-accent/20 rounded-full flex items-center justify-center mb-8 text-brand-accent animate-pulse">
                  <Upload size={32} />
                </div>
                <h2 className="text-3xl font-black text-brand-text mb-4 tracking-tight uppercase">Ready for Discovery</h2>
                <p className="text-brand-muted mb-10 leading-relaxed text-sm">
                  Upload a CSV dataset to initiate the automated analysis sequence. Our engine will synthesize features, normalize distributions, and prepare neural pathways.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full px-6">
                  <label className="flex-1 bg-brand-accent text-white px-8 py-4 rounded-xl font-bold cursor-pointer hover:opacity-90 transition-all shadow-lg shadow-brand-accent/20 active:scale-95 flex items-center justify-center gap-2">
                    <Database size={18} />
                    Import CSV
                    <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <button 
                    onClick={() => {
                      const sample = [
                        { Tenure: 5, MonthlySpend: 30.5, Calls: 1, Churn: 'No' },
                        { Tenure: 1, MonthlySpend: 89.9, Calls: 5, Churn: 'Yes' },
                        { Tenure: 12, MonthlySpend: 45.0, Calls: 0, Churn: 'No' },
                        { Tenure: 2, MonthlySpend: 75.5, Calls: 4, Churn: 'Yes' },
                        { Tenure: 24, MonthlySpend: 32.1, Calls: 1, Churn: 'No' },
                        { Tenure: 3, MonthlySpend: 95.0, Calls: 6, Churn: 'Yes' },
                        { Tenure: 18, MonthlySpend: 55.2, Calls: 2, Churn: 'No' },
                        { Tenure: 6, MonthlySpend: 68.4, Calls: 3, Churn: 'Yes' },
                        { Tenure: 36, MonthlySpend: 42.0, Calls: 0, Churn: 'No' },
                        { Tenure: 4, MonthlySpend: 82.3, Calls: 5, Churn: 'Yes' },
                        { Tenure: 48, MonthlySpend: 38.5, Calls: 1, Churn: 'No' },
                        { Tenure: 2, MonthlySpend: 79.9, Calls: 4, Churn: 'Yes' },
                        { Tenure: 15, MonthlySpend: 48.2, Calls: 2, Churn: 'No' },
                        { Tenure: 5, MonthlySpend: 72.1, Calls: 3, Churn: 'Yes' },
                        { Tenure: 60, MonthlySpend: 41.5, Calls: 0, Churn: 'No' },
                      ];
                      setOriginalData(sample);
                      setData(sample);
                      setCleaningHistory([{ message: "Neural dataset loaded: Initializing analytic nodes...", type: 'success', time: new Date().toLocaleTimeString() }]);
                      const meta = getColumnMetadata(sample);
                      setMetadata(meta);
                      const num = meta.filter(m => m.type === 'numeric');
                      const cat = meta.filter(m => m.type === 'categorical');
                      const txt = meta.filter(m => m.type === 'text');
                      if (num.length > 0) {
                        setTargetNumeric(num[0].name);
                        setSelectedX(num[0].name);
                        if (num.length > 1) setSelectedY(num[1].name);
                      }
                      if (cat.length > 0) setTargetBinary(cat[0].name);
                      if (txt.length > 0) setTextCol(txt[0].name);
                    }}
                    className="flex-1 bg-white/5 border border-brand-border text-brand-text px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <Binary size={18} />
                    Load Sample
                  </button>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="max-w-7xl mx-auto"
                >
                  {activeTab === 'wrangling' && <DataWranglingTab data={data} original={originalData} metadata={metadata} history={cleaningHistory} />}
                  {activeTab === 'stats' && <DescriptiveStatsTab data={data} metadata={metadata} />}
                  {activeTab === 'models' && (
                    <ModelsTab 
                      data={data} 
                      metadata={metadata} 
                      targetNumeric={targetNumeric} 
                      targetBinary={targetBinary} 
                      setTargetNumeric={setTargetNumeric}
                      setTargetBinary={setTargetBinary}
                    />
                  )}
                  {activeTab === 'text' && (
                    <TextAnalyticsTab 
                      data={data} 
                      textCol={textCol} 
                      setTextCol={setTextCol}
                      metadata={metadata}
                    />
                  )}
                  {activeTab === 'viz' && (
                    <VisualizationsTab 
                      data={data} 
                      metadata={metadata} 
                      style={vizStyle} 
                      selectedX={selectedX}
                      selectedY={selectedY}
                      setVizStyle={setVizStyle}
                      setSelectedX={setSelectedX}
                      setSelectedY={setSelectedY}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function uploadIcon(file: File | null) {
  if (file) return <CheckCircle2 className="text-green-500" size={24} />;
  return <Upload className="text-indigo-400 group-hover:scale-110 transition-transform" size={24} />;
}
