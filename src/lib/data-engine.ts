import { ColumnMetadata, ColumnType, DataStats } from '../types';
import * as ss from 'simple-statistics';
import _ from 'lodash';

export function detectColumnType(values: any[]): ColumnType {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNullValues.length === 0) return 'unknown';

  const isAllNumeric = nonNullValues.every(v => !isNaN(Number(v)) && v !== true && v !== false);
  if (isAllNumeric) return 'numeric';

  const isAllDate = nonNullValues.every(v => !isNaN(Date.parse(v)) && /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(String(v)));
  if (isAllDate) return 'datetime';

  const uniqueRatio = new Set(nonNullValues).size / nonNullValues.length;
  if (uniqueRatio > 0.8 && nonNullValues.some(v => String(v).split(' ').length > 3)) {
    return 'text';
  }

  return 'categorical';
}

export function getColumnMetadata(df: any[]): ColumnMetadata[] {
  if (df.length === 0) return [];
  const columns = Object.keys(df[0]);
  
  return columns.map(col => {
    const values = df.map(row => row[col]);
    const type = detectColumnType(values);
    const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
    
    return {
      name: col,
      type: type,
      distinctCount: new Set(nonNull).size,
      nullCount: df.length - nonNull.length,
      sampleValues: nonNull.slice(0, 5)
    };
  });
}

export function calculateSummary(values: number[]): DataStats {
  if (values.length === 0) return { mean: 0, median: 0, min: 0, max: 0, std: 0 };
  return {
    mean: ss.mean(values),
    median: ss.median(values),
    min: ss.min(values),
    max: ss.max(values),
    std: ss.standardDeviation(values)
  };
}

export function calculateCorrelationMatrix(data: any[], numericCols: string[]) {
  const matrix: { x: string, y: string, value: number }[] = [];
  for (let i = 0; i < numericCols.length; i++) {
    for (let j = 0; j < numericCols.length; j++) {
      const colX = numericCols[i];
      const colY = numericCols[j];
      const valsX = data.map(r => Number(r[colX])).filter(v => !isNaN(v));
      const valsY = data.map(r => Number(r[colY])).filter(v => !isNaN(v));
      
      const limit = Math.min(valsX.length, valsY.length);
      if (limit > 1) {
        const x = valsX.slice(0, limit);
        const y = valsY.slice(0, limit);
        // Check for zero variance
        const devX = ss.standardDeviation(x);
        const devY = ss.standardDeviation(y);
        
        const corr = (devX === 0 || devY === 0) ? (i === j ? 1 : 0) : ss.sampleCorrelation(x, y);
        
        matrix.push({ 
          x: colX, 
          y: colY, 
          value: isNaN(corr) ? 0 : corr
        });
      } else {
        matrix.push({ x: colX, y: colY, value: i === j ? 1 : 0 });
      }
    }
  }
  return matrix;
}

export function cleanData(df: any[], metadata: ColumnMetadata[]): { cleaned: any[], history: string[] } {
  const history: string[] = ["Initiated automated cleaning sequence..."];
  const cleaned = df.map(row => ({ ...row }));

  metadata.forEach(col => {
    const values = cleaned.map(r => r[col.name]);
    const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');

    // Impute missing
    if (col.nullCount > 0) {
      let replacement: any;
      if (col.type === 'numeric') {
        const nums = nonNull.map(Number);
        replacement = ss.median(nums);
        history.push(`OPTIMIZE: Fixed ${col.nullCount} missing values in '${col.name}' using MEDIAN strategy.`);
      } else {
        replacement = _.head(_(nonNull).countBy().entries().maxBy(_.last))?.[0] || 'Unknown';
        history.push(`OPTIMIZE: Imputed ${col.nullCount} voids in '${col.name}' via categorical MODE.`);
      }

      cleaned.forEach(row => {
        if (row[col.name] === null || row[col.name] === undefined || row[col.name] === '') {
          row[col.name] = replacement;
        }
      });
    }

    // Type conversion
    if (col.type === 'numeric') {
      cleaned.forEach(row => {
        row[col.name] = Number(row[col.name]);
      });
    }
  });

  if (history.length === 1) {
    history.push("No anomalies detected: Dataset integrity verified.");
  }

  return { cleaned, history };
}

export function getOutliers(values: number[]): { outliers: number[], lowerBound: number, upperBound: number } {
  if (values.length < 4) return { outliers: [], lowerBound: -Infinity, upperBound: Infinity };
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = ss.quantile(sorted, 0.25);
  const q3 = ss.quantile(sorted, 0.75);
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  return {
    outliers: values.filter(v => v < lower || v > upper),
    lowerBound: lower,
    upperBound: upper
  };
}
