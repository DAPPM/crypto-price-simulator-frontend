import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://crypto-price-simulator-backend.onrender.com';

function CorrelationTool() {
  const [selectedIndex, setSelectedIndex] = useState('sp500');
  const [days, setDays] = useState(90);
  const [rollingWindow, setRollingWindow] = useState(30);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const indices = [
    { key: 'sp500', name: 'S&P 500', desc: '米国大型株' },
    { key: 'nasdaq', name: 'NASDAQ', desc: 'テック株' }
  ];

  const periodOptions = [
    { value: 30, label: '30日' },
    { value: 60, label: '60日' },
    { value: 90, label: '90日' },
    { value: 180, label: '180日' },
    { value: 365, label: '1年' },
  ];

  const windowOptions = [
    { value: 7, label: '7日' },
    { value: 14, label: '14日' },
    { value: 30, label: '30日' },
    { value: 60, label: '60日' }
  ];

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/correlation/analyze`, {
        index: selectedIndex,
        days: days,
        rolling_window: rollingWindow
      });
      setResult(response.data);
    } catch (err) {
      if (err.response?.status === 429) {
        setError('APIレート制限に達しました。しばらく待ってから再試行してください。');
      } else {
        setError(err.response?.data?.error || '分析中にエラーが発生しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const getCorrelationColor = (corr) => {
    if (corr === null) return '#666';
    if (corr >= 0.7) return '#22c55e';
    if (corr >= 0.3) return '#eab308';
    return '#ef4444';
  };

  const getCorrelationLabel = (corr) => {
    if (corr === null) return '-';
    if (corr >= 0.7) return '強い正の相関';
    if (corr >= 0.3) return '中程度の相関';
    if (corr >= 0) return '弱い相関';
    return '負の相関';
  };

  return (
    <div className="correlation-tool">
      <div className="settings-grid">
        <div className="setting-card">
          <label>比較対象の株式指数</label>
          <div className="index-buttons">
            {indices.map(idx => (
              <button
                key={idx.key}
                className={`index-btn ${selectedIndex === idx.key ? 'active' : ''}`}
                onClick={() => setSelectedIndex(idx.key)}
              >
                <span className="index-name">{idx.name}</span>
                <span className="index-desc">{idx.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="setting-card">
          <label>分析期間</label>
          <div className="period-buttons">
            {periodOptions.map(opt => (
              <button
                key={opt.value}
                className={`period-btn ${days === opt.value ? 'active' : ''}`}
                onClick={() => setDays(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-card">
          <label>ローリング窓</label>
          <div className="period-buttons">
            {windowOptions.map(opt => (
              <button
                key={opt.value}
                className={`period-btn ${rollingWindow === opt.value ? 'active' : ''}`}
                onClick={() => setRollingWindow(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-card">
          <button
            className="analyze-btn"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? '分析中...' : '相関分析を実行'}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {result && (
        <div className="result-section">
          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-label">現在の相関係数</div>
              <div 
                className="summary-value"
                style={{ color: getCorrelationColor(result.decoupling.current_correlation) }}
              >
                {result.decoupling.current_correlation?.toFixed(3) ?? '-'}
              </div>
              <div className="summary-sub">
                {getCorrelationLabel(result.decoupling.current_correlation)}
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-label">平均相関係数</div>
              <div className="summary-value">
                {result.decoupling.average_correlation?.toFixed(3) ?? '-'}
              </div>
              <div className="summary-sub">
                最小: {result.decoupling.min_correlation?.toFixed(3)} / 
                最大: {result.decoupling.max_correlation?.toFixed(3)}
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-label">デカップリング状態</div>
              <div 
                className="summary-value"
                style={{ color: result.decoupling.is_decoupled ? '#ef4444' : '#22c55e' }}
              >
                {result.decoupling.is_decoupled ? 'Yes' : 'No'}
              </div>
              <div className="summary-sub">
                低相関期間: {(result.decoupling.decoupling_ratio * 100).toFixed(1)}%
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-label">期間リターン</div>
              <div className="returns-row">
                <span style={{ color: result.statistics.btc_return >= 0 ? '#22c55e' : '#ef4444' }}>
                  BTC: {result.statistics.btc_return > 0 ? '+' : ''}{result.statistics.btc_return}%
                </span>
                <span style={{ color: result.statistics.index_return >= 0 ? '#22c55e' : '#ef4444' }}>
                  {result.index_name}: {result.statistics.index_return > 0 ? '+' : ''}{result.statistics.index_return}%
                </span>
              </div>
            </div>
          </div>

          <div className="chart-section">
            <h3>相関係数の推移（{result.rolling_window}日ローリング）</h3>
            <div className="correlation-chart">
              {result.chart_data.correlations
                .filter((_, i) => i % Math.ceil(result.chart_data.correlations.length / 50) === 0)
                .map((corr, i) => (
                  <div 
                    key={i} 
                    className="chart-bar"
                    style={{
                      height: corr !== null ? `${(corr + 1) * 50}%` : '0%',
                      backgroundColor: getCorrelationColor(corr)
                    }}
                    title={corr?.toFixed(3) ?? 'N/A'}
                  />
                ))}
            </div>
            <div className="chart-labels">
              <span>-1.0</span>
              <span>0.0</span>
              <span>+1.0</span>
            </div>
          </div>

          <div className="interpretation">
            <h3>📊 分析結果の解説</h3>
            <ul>
              <li>
                <strong>相関係数 0.7以上:</strong> BTCと{result.index_name}は強く連動。リスクオン/オフで同方向に動きやすい。
              </li>
              <li>
                <strong>相関係数 0.3〜0.7:</strong> 中程度の連動。一部独自の動きあり。
              </li>
              <li>
                <strong>相関係数 0.3未満:</strong> デカップリング状態。BTCが独自の値動き。
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default CorrelationTool;