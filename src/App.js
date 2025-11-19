import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// バックエンドAPIのURL
const API_BASE_URL = 'https://crypto-price-simulator-backend.onrender.com';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState({ id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' });
  const [days, setDays] = useState(90);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const COOLDOWN_SECONDS = 10;

  // クールダウンカウントダウン
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setTimeout(() => {
        setCooldownRemaining(cooldownRemaining - 1);
        if (cooldownRemaining === 1) {
          setError(null); // カウントダウン終了でエラー消去
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownRemaining]);

  // 通貨検索（3文字以上で実行）
  const searchCoins = async (query) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/coins/search?q=${query}`);
      setSearchResults(response.data.data || []);
      setShowDropdown(response.data.data && response.data.data.length > 0);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  // 検索クエリが変更されたら1秒後に検索実行
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCoins(searchQuery);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 通貨選択
  const selectCoin = (coin) => {
    setSelectedCoin(coin);
    setSearchQuery('');
    setShowDropdown(false);
    setSearchResults([]);
    setResult(null);
    setError(null);
    setCooldownRemaining(0);
  };

  // 分析実行
  const analyze = async () => {
    // クールダウンチェック
    const now = Date.now();
    const timeSinceLastAnalysis = (now - lastAnalysisTime) / 1000;
    
    if (timeSinceLastAnalysis < COOLDOWN_SECONDS) {
      const remaining = Math.ceil(COOLDOWN_SECONDS - timeSinceLastAnalysis);
      setError(`連続検索を防ぐため、${remaining}秒後に再試行してください`);
      setCooldownRemaining(remaining);
      return;
    }
    
    setLoading(true);
    setError(null);
    setCooldownRemaining(0);
    setLastAnalysisTime(now);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/analysis`, {
        coin_id: selectedCoin.id,
        days: days
      });
      
      setResult(response.data.data);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'APIエラーが発生しました。しばらく待ってから再試行してください。';
      setError(errorMsg);
      
      // エラーを5秒後に自動消去
      setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  // -10%から+9%まで1%刻みで生成
  const returnLabels = Array.from({ length: 20 }, (_, i) => {
    const value = -10 + i;
    return value >= 0 ? `+${value}%` : `${value}%`;
  });

  return (
    <div className="App">
      <header className="App-header">
        <h1>暗号資産価格シミュレーションツール</h1>
        
        <div className="controls-container">
          {/* 通貨選択エリア（左上） */}
          <div className="coin-selection-group">
            <label className="control-label">通貨選択</label>
            <div className="coin-search-wrapper">
              <input 
                type="text" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="3文字以上入力（例: BTC, ETH, SOL）"
                className="search-input"
              />
              
              {showDropdown && searchResults.length > 0 && (
                <div className="search-dropdown">
                  {searchResults.map((coin) => (
                    <div 
                      key={coin.id}
                      className="search-result-item"
                      onClick={() => selectCoin(coin)}
                    >
                      <span className="coin-symbol">{coin.symbol.toUpperCase()}</span>
                      <span className="coin-name">{coin.name}</span>
                      {coin.market_cap_rank && (
                        <span className="coin-rank">#{coin.market_cap_rank}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* 分析期間選択（右上） */}
          <div className="period-selection-group">
            <label className="control-label">分析期間</label>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="period-select">
              <option value={30}>30日</option>
              <option value={60}>60日</option>
              <option value={90}>90日</option>
              <option value={180}>180日</option>
              <option value={365}>365日</option>
            </select>
          </div>
          
          {/* 選択中の通貨表示（左下） */}
          <div className="selected-coin-display">
            <span className="selected-label">選択中:</span>
            <span className="selected-symbol">{selectedCoin.symbol.toUpperCase()}</span>
            <span className="selected-name">{selectedCoin.name}</span>
          </div>
          
          {/* 分析開始ボタン（右下） */}
          <div className="analyze-button-container">
            <button onClick={analyze} disabled={loading || cooldownRemaining > 0} className="analyze-button">
              {loading ? '分析中...' : cooldownRemaining > 0 ? `${cooldownRemaining}秒待機` : '分析開始'}
            </button>
          </div>
        </div>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {result && (
          <div className="results">
            <h2>{selectedCoin.symbol.toUpperCase()} - 統計分析結果</h2>
            
            <div className="stats">
              <div className="stat-card">
                <div className="stat-label">現在価格</div>
                <div className="stat-value">
                  {result.current_price ? `$${result.current_price.toLocaleString()}` : '取得中...'}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">日次ボラティリティ</div>
                <div className="stat-value">{(result.statistics.daily_volatility * 100).toFixed(2)}%</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">年率リターン</div>
                <div className="stat-value">{(result.statistics.annualized_return * 100).toFixed(2)}%</div>
              </div>
            </div>

            <h3>確率テーブル（day1〜day7、-10%〜+9%）</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>リターン</th>
                    <th>day1</th>
                    <th>day2</th>
                    <th>day3</th>
                    <th>day4</th>
                    <th>day5</th>
                    <th>day6</th>
                    <th>day7</th>
                  </tr>
                </thead>
                <tbody>
                  {returnLabels.map(label => (
                    <tr key={label}>
                      <td className="label-cell">{label}</td>
                      <td>{result.probability_table[label]?.[1]?.toFixed(2)}%</td>
                      <td>{result.probability_table[label]?.[2]?.toFixed(2)}%</td>
                      <td>{result.probability_table[label]?.[3]?.toFixed(2)}%</td>
                      <td>{result.probability_table[label]?.[4]?.toFixed(2)}%</td>
                      <td>{result.probability_table[label]?.[5]?.toFixed(2)}%</td>
                      <td>{result.probability_table[label]?.[6]?.toFixed(2)}%</td>
                      <td>{result.probability_table[label]?.[7]?.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="tail-probs">
              <h3>裾確率（7日後、±10%）</h3>
              <div className="tail-stats">
                <div className="tail-stat">
                  <span className="tail-label">-10%以下に下落:</span>
                  <span className="tail-value">{result.tail_probabilities.prob_drop_below.toFixed(2)}%</span>
                </div>
                <div className="tail-stat">
                  <span className="tail-label">+10%以上に上昇:</span>
                  <span className="tail-value">{result.tail_probabilities.prob_rise_above.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="disclaimer">
          <p>⚠️ 本ツールは過去の価格データをもとに統計モデルでシミュレーションした結果であり、将来の価格を保証するものではありません。投資判断はご自身の責任で行ってください。</p>
        </div>
      </header>
    </div>
  );
}

export default App;