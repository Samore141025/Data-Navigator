import { ModelMetrics } from '../types';
import _ from 'lodash';
import { kmeans as mlKmeans } from 'ml-kmeans';

// Custom lightweight ML implementations for browser compatibility
export function trainLinearRegression(X: number[][], y: number[]): ModelMetrics {
  // Simple Multivariable Linear Regression (Normal Equation or SGD)
  // For simplicity here, we use a basic multivariable least squares approach
  // Since we have small data, we can use a simple matrix-less approach or one feature at a time
  
  const n = y.length;
  if (n === 0) return { name: 'Linear Regression', r2: 0, mse: 0 };

  const yMean = _.mean(y);
  
  // Just use the first feature for a simple demo if needed, or all
  // Let's do a simple SGD for all features
  let weights = X[0].map(() => Math.random());
  let bias = Math.random();
  const lr = 0.01;
  const epochs = 100;
  
  for (let iter = 0; iter < epochs; iter++) {
    for (let i = 0; i < n; i++) {
      const pred = X[i].reduce((sum, val, idx) => sum + val * weights[idx], bias);
      const err = pred - y[i];
      if (isNaN(err)) continue;
      weights = weights.map((w, idx) => w - lr * err * X[i][idx]);
      bias = bias - lr * err;
    }
  }

  const predictions = X.map(row => row.reduce((sum, val, idx) => sum + val * weights[idx], bias));
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

export function trainKMeans(X: number[][], k: number = 3): ModelMetrics {
  if (X.length === 0) return { name: 'K-Means', confusionMatrix: [[0]] };
  const result = mlKmeans(X, Math.min(k, X.length), { initialization: 'kmeans++' });
  const clusters = result.clusters;
  
  // Frequency of each cluster
  const counts = Array(k).fill(0);
  clusters.forEach(c => {
    if (counts[c] !== undefined) counts[c]++;
  });
  const matrix = [counts];
  
  return { 
    name: `K-Means (k=${k})`, 
    accuracy: undefined, 
    confusionMatrix: matrix as number[][] 
  };
}

export function trainNaiveBayes(X: number[][], y: number[]): ModelMetrics {
  const classes = Array.from(new Set(y));
  const priors = classes.map(c => y.filter(val => val === c).length / y.length);
  
  const predictions = X.map(row => {
    const scores = classes.map((c, i) => {
      let score = Math.log(priors[i]);
      // Simple gaussian-ish or frequency-based approach for continuous features
      // For this app, we'll use a very simplified probability
      row.forEach((val, featureIdx) => {
        const featureValuesInClass = X.filter((_, idx) => y[idx] === c).map(r => r[featureIdx]);
        const mean = _.mean(featureValuesInClass) || 0;
        const std = Math.sqrt(_.mean(featureValuesInClass.map(v => Math.pow(v - mean, 2)))) || 1;
        // Gaussian PDF simplified
        const exponent = Math.exp(-Math.pow(val - mean, 2) / (2 * Math.pow(std, 2)));
        score += Math.log((1 / (Math.sqrt(2 * Math.PI) * std)) * exponent + 1e-9);
      });
      return score;
    });
    return classes[scores.indexOf(Math.max(...scores))];
  });
  
  return calculateClassificationMetrics('Naive Bayes', y, predictions);
}

export function trainLogisticRegression(X: number[][], y: number[]): ModelMetrics {
  const n = y.length;
  let weights = X[0].map(() => Math.random());
  let bias = Math.random();
  const lr = 0.1;
  const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

  for (let iter = 0; iter < 500; iter++) {
    for (let i = 0; i < n; i++) {
      const z = X[i].reduce((sum, val, idx) => sum + val * weights[idx], bias);
      const h = sigmoid(z);
      const err = h - y[i];
      weights = weights.map((w, idx) => w - lr * err * X[i][idx]);
      bias = bias - lr * err;
    }
  }

  const predictions = X.map(row => {
    const z = row.reduce((sum, val, idx) => sum + val * weights[idx], bias);
    return sigmoid(z) >= 0.5 ? 1 : 0;
  });

  return calculateClassificationMetrics('Logistic Regression', y, predictions);
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
