import { ModelMetrics } from '../types';
import _ from 'lodash';
import { kmeans as mlKmeans } from 'ml-kmeans';

// Custom lightweight ML implementations for browser compatibility
export function trainLinearRegression(X: number[][], y: number[]): ModelMetrics {
  const n = y.length;
  if (n === 0 || X.length === 0 || !X[0]) return { name: 'Linear Regression', r2: 0, mse: 0 };

  const { scaledX } = scaleFeatures(X);
  const yMean = _.mean(y);
  
  // Weights initialization
  let weights = scaledX[0].map(() => 0);
  let bias = 0;
  const lr = 0.01;
  const epochs = 200;
  
  for (let iter = 0; iter < epochs; iter++) {
    for (let i = 0; i < n; i++) {
      const pred = scaledX[i].reduce((sum, val, idx) => sum + val * weights[idx], bias);
      const err = pred - y[i];
      if (isNaN(err)) continue;
      weights = weights.map((w, idx) => w - lr * err * scaledX[i][idx]);
      bias = bias - lr * err;
    }
  }

  const predictions = scaledX.map(row => row.reduce((sum, val, idx) => sum + val * weights[idx], bias));
  const ssRes = _.sum(predictions.map((p, i) => Math.pow(p - y[i], 2)));
  const ssTot = _.sum(y.map(val => Math.pow(val - yMean, 2)));
  const mse = predictions.length > 0 ? ssRes / predictions.length : 0;
  const r2 = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);

  return { 
    name: 'Linear Regression', 
    r2: isNaN(r2) ? 0 : r2, 
    mse: isNaN(mse) ? 0 : mse 
  };
}

export function trainKMeans(X: number[][], y?: number[], k: number = 3): ModelMetrics {
  if (X.length === 0) return { name: 'K-Means', confusionMatrix: [[0]] };
  const numClusters = Math.min(k, X.length);
  const result = mlKmeans(X, numClusters, { initialization: 'kmeans++' });
  const clusters = result.clusters;
  
  // If we have labels, we can create a proper confusion matrix 
  // (Cluster Index vs True Label)
  if (y && y.length === clusters.length) {
    const uniqueLabels = Array.from(new Set(y)).sort((a, b) => a - b);
    const numLabels = uniqueLabels.length;
    // We want a square matrix or at least a comparison grid. 
    // Let's use max(numClusters, numLabels) to keep it intuitive.
    const size = Math.max(numClusters, numLabels);
    const matrix = Array.from({ length: size }, () => Array.from({ length: size }, () => 0));

    clusters.forEach((clusterIdx, i) => {
      const labelIdx = uniqueLabels.indexOf(y[i]);
      if (clusterIdx < size && labelIdx < size) {
        // Predicted (Row) vs Actual (Column)
        matrix[clusterIdx][labelIdx]++;
      }
    });

    return {
      name: `K-Means (${numClusters} Clusters)`,
      confusionMatrix: matrix
    };
  }

  // Frequency of each cluster (fallback 1xK)
  const counts = Array(numClusters).fill(0);
  clusters.forEach(c => {
    if (counts[c] !== undefined) counts[c]++;
  });
  
  return { 
    name: `K-Means (k=${numClusters})`, 
    accuracy: undefined, 
    confusionMatrix: [counts] as number[][] 
  };
}

function scaleFeatures(X: number[][]) {
  const numFeatures = X[0]?.length || 0;
  const n = X.length;
  if (n === 0) return { scaledX: X, means: [], stds: [] };

  const means = Array(numFeatures).fill(0);
  const stds = Array(numFeatures).fill(0);

  for (let j = 0; j < numFeatures; j++) {
    const col = X.map(row => row[j]);
    means[j] = _.mean(col);
    stds[j] = Math.sqrt(_.mean(col.map(v => Math.pow(v - means[j], 2)))) || 1;
  }

  const scaledX = X.map(row => row.map((v, j) => (v - means[j]) / stds[j]));
  return { scaledX, means, stds };
}

function calculateClassificationMetrics(name: string, yTrue: number[], yPred: number[]): ModelMetrics {
  const uniqueLabels = Array.from(new Set([...yTrue, ...yPred])).sort((a, b) => a - b);
  const matrix = Array.from({ length: uniqueLabels.length }, () => 
    Array.from({ length: uniqueLabels.length }, () => 0)
  );

  let correct = 0;
  yTrue.forEach((val, i) => {
    const trueIdx = uniqueLabels.indexOf(val);
    const predIdx = uniqueLabels.indexOf(yPred[i]);
    matrix[trueIdx][predIdx]++;
    if (val === yPred[i]) correct++;
  });

  const accuracy = correct / yTrue.length;
  return { name, accuracy, confusionMatrix: matrix };
}

export function prepareData(df: any[], targetCol: string, featureCols: string[], type: 'numeric' | 'binary' | 'multiclass') {
  // Filter rows where any feature or target is NaN
  const safeData = df.filter(row => {
    const featuresValid = featureCols.every(col => !isNaN(Number(row[col])) && row[col] !== null && row[col] !== '');
    const targetValid = targetCol ? (!isNaN(Number(row[targetCol])) && row[targetCol] !== null && row[targetCol] !== '') : true;
    return featuresValid && targetValid;
  });

  const X = safeData.map(row => featureCols.map(col => Number(row[col])));
  let y: number[];
  
  if (type === 'numeric') {
    y = safeData.map(row => Number(row[targetCol]));
  } else {
    const labels = Array.from(new Set(safeData.map(row => String(row[targetCol]))));
    y = safeData.map(row => labels.indexOf(String(row[targetCol])));
  }

  return { X, y };
}
