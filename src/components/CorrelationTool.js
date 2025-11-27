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
    { value: 365, label: '1年' }
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
    if (corr === null || corr === undefined) return '#666';
    if (corr >= 0.7) return '#22c55e';
    if (corr >= 0.3) return '#eab308';
    return '#ef4444';
  };

  const getCorrelationLabel = (corr) => {
    if (corr === null || corr === undefined) return '-';
    if (corr >= 0.7) return '強い正の相関';
    if (corr >= 0.3) return '中程度の相関';
    if (corr >= 0) return '弱い相関';
    return '負の相関';
  };

  const formatCorrelation = (corr) => {
    if (corr === null || corr === undefined) return '-';
    return corr.toFixed(3);
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
                <strong>{idx.name}</strong>
                <span>{idx.desc}</span>
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

      {error && (
        <div className="error-message">{error}</div>
      )}

      {result && (
        <div className="result-section">
          {/* メイン指標 - 2x2グリッド */}
          <div className="stats-grid-2x2">
            <div className="stat-card">
              <label>現在の相関係数</label>
              <div className="stat-value" style={{ color: getCorrelationColor(result.decoupling.current_correlation) }}>
                {result.decoupling.current_correlation?.toFixed(3) || '-'}
              </div>
              <div className="stat-label">{getCorrelationLabel(result.decoupling.current_correlation)}</div>
            </div>
            <div className="stat-card">
              <label>平均相関係数</label>
              <div className="stat-value">
                {result.decoupling.average_correlation?.toFixed(3) || '-'}
              </div>
              <div className="stat-label">
                最小: {result.decoupling.min_correlation?.toFixed(3)} / 最大: {result.decoupling.max_correlation?.toFixed(3)}
              </div>
            </div>
            <div className="stat-card">
              <label>デカップリング状態</label>
              <div className="stat-value" style={{ color: result.decoupling.is_decoupled ? '#ef4444' : '#22c55e' }}>
                {result.decoupling.is_decoupled ? 'Yes' : 'No'}
              </div>
              <div className="stat-label">低相関期間: {(result.decoupling.decoupling_ratio * 100).toFixed(1)}%</div>
            </div>
            <div className="stat-card">
              <label>期間リターン</label>
              <div className="stat-label" style={{ fontSize: '1rem' }}>
                <span style={{ color: result.statistics.btc_return >= 0 ? '#22c55e' : '#ef4444' }}>
                  BTC: {result.statistics.btc_return >= 0 ? '+' : ''}{result.statistics.btc_return}%
                </span>
                <br />
                <span style={{ color: result.statistics.index_return >= 0 ? '#22c55e' : '#ef4444' }}>
                  {result.index_name}: {result.statistics.index_return >= 0 ? '+' : ''}{result.statistics.index_return}%
                </span>
              </div>
            </div>
          </div>

          {/* 方向一致分析 */}
          {result.direction_analysis && (
            <div className="analysis-section">
              <h3>📊 方向一致分析</h3>
              <div className="direction-grid">
                <div className="direction-card highlight">
                  <div className="direction-value">{result.direction_analysis.same_direction_rate}%</div>
                  <div className="direction-label">同じ方向に動いた日</div>
                  <div className="direction-detail">{result.direction_analysis.same_direction_days} / {result.direction_analysis.total_days}日</div>
                </div>
                <div className="direction-card">
                  <div className="direction-value green">{result.direction_analysis.both_up_days}日</div>
                  <div className="direction-label">両方上昇</div>
                </div>
                <div className="direction-card">
                  <div className="direction-value red">{result.direction_analysis.both_down_days}日</div>
                  <div className="direction-label">両方下落</div>
                </div>
                <div className="direction-card">
                  <div className="direction-value">{result.direction_analysis.btc_up_index_down}日</div>
                  <div className="direction-label">BTC↑ 株↓</div>
                </div>
                <div className="direction-card">
                  <div className="direction-value">{result.direction_analysis.btc_down_index_up}日</div>
                  <div className="direction-label">BTC↓ 株↑</div>
                </div>
              </div>
            </div>
          )}

          {/* 条件付き相関 */}
          {result.conditional_correlation && (
            <div className="analysis-section">
              <h3>📈 条件付き相関（市場環境別）</h3>
              <div className="conditional-grid">
                <div className="conditional-card">
                  <div className="conditional-label">株価上昇日の相関</div>
                  <div className="conditional-value" style={{ color: getCorrelationColor(result.conditional_correlation.correlation_on_up_days) }}>
                    {formatCorrelation(result.conditional_correlation.correlation_on_up_days)}
                  </div>
                  <div className="conditional-detail">
                    {result.conditional_correlation.up_days_count}日間
                    {result.conditional_correlation.up_reliable === false && (
                      <span className="low-reliability"> ⚠️ 信頼性低</span>
                    )}
                  </div>
                </div>
                <div className="conditional-card">
                  <div className="conditional-label">株価下落日の相関</div>
                  <div className="conditional-value" style={{ color: getCorrelationColor(result.conditional_correlation.correlation_on_down_days) }}>
                    {formatCorrelation(result.conditional_correlation.correlation_on_down_days)}
                  </div>
                  <div className="conditional-detail">
                    {result.conditional_correlation.down_days_count}日間
                    {result.conditional_correlation.down_reliable === false && (
                      <span className="low-reliability"> ⚠️ 信頼性低</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="conditional-insight">
                <p>
                  <strong>📈 株価上昇日:</strong> 相関 {formatCorrelation(result.conditional_correlation.correlation_on_up_days)}
                  {result.conditional_correlation.correlation_on_up_days >= 0.3 
                    ? ' → BTCも上昇しやすい' 
                    : ' → BTCは独自の動き'}
                </p>
                <p>
                  <strong>📉 株価下落日:</strong> 相関 {formatCorrelation(result.conditional_correlation.correlation_on_down_days)}
                  {result.conditional_correlation.correlation_on_down_days >= 0.3 
                    ? ' → BTCも下落しやすい（リスクオフ連動）' 
                    : ' → BTCは独自の動き（分散効果あり）'}
                </p>
                {result.conditional_correlation.correlation_on_down_days > result.conditional_correlation.correlation_on_up_days + 0.1 && (
                  <p className="warning">⚠️ 下落時の相関が高い → 暴落時の分散効果は限定的</p>
                )}
                {(result.conditional_correlation.up_reliable === false || result.conditional_correlation.down_reliable === false) && (
                  <p className="note">※ 10日未満のデータは統計的信頼性が低下します</p>
                )}
              </div>
            </div>
          )}

          {/* ボラティリティ比較 */}
          {result.statistics.btc_volatility && (
            <div className="analysis-section">
              <h3>📉 ボラティリティ（年率換算）</h3>
              <div className="volatility-grid">
                <div className="volatility-card">
                  <div className="volatility-label">BTC</div>
                  <div className="volatility-value">{result.statistics.btc_volatility}%</div>
                </div>
                <div className="volatility-card">
                  <div className="volatility-label">{result.index_name}</div>
                  <div className="volatility-value">{result.statistics.index_volatility}%</div>
                </div>
                <div className="volatility-card">
                  <div className="volatility-label">倍率</div>
                  <div className="volatility-value">
                    {(result.statistics.btc_volatility / result.statistics.index_volatility).toFixed(1)}x
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 相関推移グラフ（折れ線） */}
          <div className="chart-section">
            <h3>相関係数の推移（{rollingWindow}日ローリング）</h3>
            <div className="line-chart-container">
              <svg viewBox="0 0 800 300" className="correlation-line-chart">
                {/* 背景ゾーン */}
                <rect x="50" y="20" width="730" height="75" fill="rgba(34, 197, 94, 0.1)" />
                <rect x="50" y="95" width="730" height="90" fill="rgba(234, 179, 8, 0.1)" />
                <rect x="50" y="185" width="730" height="95" fill="rgba(239, 68, 68, 0.1)" />
                
                {/* グリッド線 */}
                <line x1="50" y1="20" x2="780" y2="20" stroke="#333" strokeWidth="1" />
                <line x1="50" y1="95" x2="780" y2="95" stroke="#666" strokeWidth="1" strokeDasharray="5,5" />
                <line x1="50" y1="140" x2="780" y2="140" stroke="#444" strokeWidth="1" />
                <line x1="50" y1="185" x2="780" y2="185" stroke="#666" strokeWidth="1" strokeDasharray="5,5" />
                <line x1="50" y1="280" x2="780" y2="280" stroke="#333" strokeWidth="1" />
                
                {/* Y軸ラベル */}
                <text x="45" y="25" fill="#888" fontSize="12" textAnchor="end">+1.0</text>
                <text x="45" y="100" fill="#22c55e" fontSize="12" textAnchor="end">+0.7</text>
                <text x="45" y="145" fill="#888" fontSize="12" textAnchor="end">0</text>
                <text x="45" y="190" fill="#eab308" fontSize="12" textAnchor="end">+0.3</text>
                <text x="45" y="285" fill="#888" fontSize="12" textAnchor="end">-1.0</text>
                
                {/* 折れ線 */}
                <polyline
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                  points={
                    result.chart_data.correlations
                      .map((corr, i) => {
                        if (corr === null) return null;
                        const x = 50 + (i / (result.chart_data.correlations.length - 1)) * 730;
                        const y = 140 - (corr * 120);
                        return `${x},${y}`;
                      })
                      .filter(p => p !== null)
                      .join(' ')
                  }
                />
                
                {/* ゾーンラベル */}
                <text x="790" y="60" fill="#22c55e" fontSize="11" textAnchor="start">強い相関</text>
                <text x="790" y="140" fill="#eab308" fontSize="11" textAnchor="start">中程度</text>
                <text x="790" y="230" fill="#ef4444" fontSize="11" textAnchor="start">弱い/負</text>
              </svg>
            </div>
            <div className="chart-dates">
              <span>{result.chart_data.dates[0]}</span>
              <span>{result.chart_data.dates[Math.floor(result.chart_data.dates.length / 2)]}</span>
              <span>{result.chart_data.dates[result.chart_data.dates.length - 1]}</span>
            </div>
          </div>

          {/* 解説 */}
          <div className="interpretation">
            <h3>📖 分析結果の解説</h3>
            <ul>
              <li><strong>相関係数 0.7以上:</strong> BTCと{result.index_name}は強く連動。リスクオン/オフで同方向に動きやすい。</li>
              <li><strong>相関係数 0.3〜0.7:</strong> 中程度の連動。一部独自の動きあり。</li>
              <li><strong>相関係数 0.3未満:</strong> デカップリング状態。BTCが独自の値動き。</li>
              <li><strong>方向一致率:</strong> 相関係数とは別に、単純に同じ方向（上昇/下落）に動いた日の割合。</li>
              <li><strong>条件付き相関:</strong> 株が上昇した日と下落した日で相関が異なることが多い。下落時に相関が高いと、分散効果が薄れる。</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default CorrelationTool;