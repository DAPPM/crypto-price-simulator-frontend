import React, { useState } from 'react';
import PriceSimulator from './components/PriceSimulator';
import CorrelationTool from './components/CorrelationTool';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('simulator');

  const tabs = [
    { id: 'simulator', label: 'Price Simulator', icon: '📊' },
    { id: 'correlation', label: 'BTC vs US Equities', icon: '🔗' }
  ];

  return (
    <div className="App">
      <header className="App-header">
        <h1>Crypto Analysis Tools</h1>
        <p className="header-subtitle">暗号資産の統計分析・相関分析ツール</p>

        <nav className="tab-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        <main className="tab-content">
          {activeTab === 'simulator' && <PriceSimulator />}
          {activeTab === 'correlation' && <CorrelationTool />}
        </main>

        <footer className="app-footer">
          <p>Data provided by CoinGecko & Stooq</p>
        </footer>
      </header>
    </div>
  );
}

export default App;