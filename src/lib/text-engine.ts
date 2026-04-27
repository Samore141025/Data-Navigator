import _ from 'lodash';

const STOPWORDS = new Set(['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now']);

export function processText(text: string): string[] {
  if (!text) return [];
  
  // Clean & Tokenize
  const tokens = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 0 && !STOPWORDS.has(t));
    
  return tokens;
}

export function calculateTFIDF(documents: string[][]) {
  const n = documents.length;
  const termFreqs = documents.map(doc => _.countBy(doc));
  const docFreqs: Record<string, number> = {};
  
  documents.forEach(doc => {
    const uniqueTerms = new Set(doc);
    uniqueTerms.forEach(term => {
      docFreqs[term] = (docFreqs[term] || 0) + 1;
    });
  });

  const idfs: Record<string, number> = {};
  Object.keys(docFreqs).forEach(term => {
    idfs[term] = Math.log(n / docFreqs[term]);
  });

  // Calculate scores for all terms combined
  const globalScores: Record<string, number> = {};
  termFreqs.forEach((tfMap, i) => {
    Object.keys(tfMap).forEach(term => {
      const tf = tfMap[term];
      const score = tf * idfs[term];
      globalScores[term] = (globalScores[term] || 0) + score;
    });
  });

  return Object.entries(globalScores)
    .map(([term, score]) => ({ term, score }))
    .sort((a, b) => b.score - a.score);
}
