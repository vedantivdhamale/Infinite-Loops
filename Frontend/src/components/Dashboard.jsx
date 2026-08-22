import React, { useState, useEffect, useCallback } from 'react';
import SummaryCards from './SummaryCards';
import RiskDistribution from './RiskDistribution';
import TransactionTable from './TransactionTable';
import { mockResponse, rawTransactions } from '../data/mockResponse';
import { scoreTransactions, checkApiHealth } from '../services/api';

// Risk priority map for sorting
const RISK_PRIORITY = {
  'Critical': 4,
  'High': 3,
  'Medium': 2,
  'Low': 1
};

export default function Dashboard() {
  // Config state - easy to toggle mock/real mode
  const [useMockData, setUseMockData] = useState(true);
  const [apiStatus, setApiStatus] = useState('offline'); // 'connected' | 'offline' | 'checking'
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Filters & Sorting state
  const [searchText, setSearchText] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [sortKey, setSortKey] = useState('risk_level'); // Default sort by level
  const [sortDirection, setSortDirection] = useState('desc'); // Default desc (Critical first)

  // Check API health
  const checkHealth = useCallback(async () => {
    try {
      setApiStatus('checking');
      await checkApiHealth();
      setApiStatus('connected');
      return true;
    } catch (err) {
      setApiStatus('offline');
      return false;
    }
  }, []);

  // Fetch / Score transactions
  const loadData = useCallback(async (isRefreshing = false) => {
    setIsLoading(true);
    setErrorMessage('');
    
    // Artificial small delay for premium visual feedback of analysis spinner
    if (isRefreshing) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (useMockData) {
      setTransactions([...mockResponse]);
      setIsLoading(false);
    } else {
      try {
        const isHealthy = await checkHealth();
        if (!isHealthy) {
          throw new Error("FastAPI backend is offline. Run your backend at http://localhost:8000");
        }
        const data = await scoreTransactions(rawTransactions);
        setTransactions(data);
      } catch (err) {
        setErrorMessage(err.message || 'Failed to fetch transaction scores');
        // Do not crash the application, keep the current transactions or allow mock data
      } finally {
        setIsLoading(false);
      }
    }
  }, [useMockData, checkHealth]);

  // Load data on configuration change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Periodic health check if not in mock mode
  useEffect(() => {
    if (useMockData) return;
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [useMockData, checkHealth]);

  // Handle Refresh Action
  const handleRefresh = () => {
    loadData(true);
  };

  // Sort & Filter transactions
  const getProcessedTransactions = () => {
    let result = [...transactions];

    // 1. Search text filter (Transaction ID or Customer ID)
    if (searchText.trim()) {
      const query = searchText.toLowerCase();
      result = result.filter(tx => 
        tx.transaction_id.toLowerCase().includes(query) ||
        tx.customer_id.toLowerCase().includes(query)
      );
    }

    // 2. Risk Level filter
    if (riskFilter !== 'All') {
      result = result.filter(tx => tx.risk_level === riskFilter);
    }

    // 3. Sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortKey === 'risk_level') {
        const priorityA = RISK_PRIORITY[a.risk_level] || 0;
        const priorityB = RISK_PRIORITY[b.risk_level] || 0;
        comparison = priorityA - priorityB;
        
        // Secondary sort by risk score if risk level is identical
        if (comparison === 0) {
          comparison = a.risk_score - b.risk_score;
        }
      } else if (sortKey === 'risk_score') {
        comparison = a.risk_score - b.risk_score;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  };

  const handleSortChange = (key) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc'); // Default to descending
    }
  };

  const clearFilters = () => {
    setSearchText('');
    setRiskFilter('All');
    setSortKey('risk_level');
    setSortDirection('desc');
  };

  const isFilterActive = searchText !== '' || riskFilter !== 'All' || sortKey !== 'risk_level' || sortDirection !== 'desc';
  const processedTransactions = getProcessedTransactions();

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="dashboard-header">
        <div className="brand-section">
          <div className="brand-logo">
            <svg 
              width="28" 
              height="28" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="brand-title-group">
            <h1>FraudGuard</h1>
            <div className="brand-subtitle">Cross-Channel Transaction Risk Intelligence</div>
          </div>
        </div>

        <div className="status-controls">
          {/* API Connection Indicator */}
          {useMockData ? (
            <div className="status-indicator mock">
              <span className="status-dot"></span>
              Mock Data
            </div>
          ) : (
            <div className={`status-indicator ${apiStatus}`}>
              <span className="status-dot"></span>
              {apiStatus === 'connected' ? 'API Connected' : apiStatus === 'checking' ? 'Connecting...' : 'API Offline'}
            </div>
          )}

          {/* Refresh Button */}
          <button 
            className="btn-refresh" 
            onClick={handleRefresh} 
            disabled={isLoading}
            title="Refresh transactions"
          >
            <svg 
              className={isLoading ? 'spinning' : ''}
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        {/* Toggle Bar */}
        <div className="mode-banner">
          <div className="mode-banner-info">
            <p><strong>Environment Configuration</strong></p>
            <span>Switch to test with live FastAPI scoring endpoints or local static records</span>
          </div>
          <button 
            className="btn-toggle-mode" 
            onClick={() => setUseMockData(!useMockData)}
          >
            {useMockData ? "Switch to Live API Mode" : "Switch to Mock Data Mode"}
          </button>
        </div>

        {/* Live API Error message if offline */}
        {!useMockData && errorMessage && (
          <div className="error-banner">
            <strong>Unable to connect to the fraud scoring API.</strong>
            <span>{errorMessage}</span>
            <span style={{ fontSize: '0.8rem', marginTop: '4px' }}>
              Ensure your FastAPI server is running on <code>http://localhost:8000</code> and has CORS enabled.
            </span>
          </div>
        )}

        {/* Dynamic Summary Metric Cards (reduced margin/padding in CSS) */}
        <SummaryCards transactions={transactions} />

        {/* Risk Distribution Profile Chart */}
        <RiskDistribution transactions={processedTransactions} />

        {/* Search, Filter, Sort toolbar */}
        <div className="filters-section">
          <div className="search-filter-group">
            <div className="search-input-wrapper">
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input 
                type="text" 
                className="input-search"
                placeholder="Search by Transaction or Customer ID..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <select 
              className="dropdown-filter"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
            >
              <option value="All">All Risk Levels</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>

            <button 
              className="btn-clear-filters"
              onClick={clearFilters}
              disabled={!isFilterActive}
            >
              Clear Filters
            </button>
          </div>

          <div className="sort-group">
            <span className="sort-label">Sort Priority:</span>
            <select 
              className="dropdown-filter"
              value={sortKey}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="risk_level">Risk Level</option>
              <option value="risk_score">Risk Score</option>
            </select>
          </div>
        </div>

        {/* Transaction risk data table */}
        <TransactionTable 
          transactions={processedTransactions} 
          isLoading={isLoading}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
        />
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        FraudGuard Security Dashboard &bull; Hackathon Project &bull; Person 6 UI Dev Integration
      </footer>
    </div>
  );
}
