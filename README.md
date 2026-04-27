# Advanced Data Navigator - CSV Requirements

To ensure all functions (ML, Stats, Text Analytics) work correctly, your CSV file should follow these guidelines:

## 1. File Format
- **Type**: Standard CSV (Comma Separated Values).
- **Encoding**: UTF-8.
- **Max Size**: 100MB.

## 2. Recommended Structure
Your CSV should include a header row with unique names. For best results, include various data types:

| Data Type | Example Column | Used For |
|-----------|----------------|----------|
| **Numeric** | `age`, `price`, `score` | Histograms, Heatmaps, Linear Regression, Clustering |
| **Categorical** | `status`, `category` | Grouped Descriptive Stats, Bar Charts |
| **Text** | `review`, `comment` | Word Clouds, Sentiment Analysis, TF-IDF |
| **Boolean** | `is_active`, `purchased` | Logistic Regression, Binary Classification |

## 3. Common Issues & Solutions
- **NaN in ML Results**: This happens if your selected target has 0 variance (all values are the same) or the dataset is too small. Ensure your target variable has multiple different values.
- **Missing Heatmap**: Visualizations > Heatmap requires at least two numeric columns to calculate correlations.
- **Empty Word Cloud**: Ensure you select a column with descriptive text (not IDs or short codes).
