import React, { useState, useEffect, useCallback } from 'react';
import SummaryCards from './SummaryCards';
import RiskDistribution from './RiskDistribution';
import TransactionTable from './TransactionTable';
import CustomerProfileTable from './CustomerProfileTable';
import rawTransactions from '../data/transactions.json';
import mockScoredTransactions from '../data/mockScoredTransactions.json';
import mockCustomerProfiles from '../data/mockCustomerProfiles.json';
import { scoreTransactions, fetchCustomerProfiles, checkApiHealth } from '../services/api';

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
  const [customerProfiles, setCustomerProfiles] = useState([]);
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'customers'
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Filters & Sorting state
  const [searchText, setSearchText] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  
  // Sorting state for transactions
  const [sortKey, setSortKey] = useState('risk_level'); // Default sort by level
  const [sortDirection, setSortDirection] = useState('desc'); // Default desc (Critical first)

  // Sorting state for customer profiles
  const [customerSortKey, setCustomerSortKey] = useState('overall_risk_score');
  const [customerSortDirection, setCustomerSortDirection] = useState('desc');

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
      setTransactions([...mockScoredTransactions]);
      setCustomerProfiles([...mockCustomerProfiles]);
      setIsLoading(false);
    } else {
      try {
        const isHealthy = await checkHealth();
        if (!isHealthy) {
          throw new Error("FastAPI backend is offline. Run your backend at http://localhost:8000");
        }
        // Fetch both transaction scores and customer profiles using the backend
        const [txData, profileData] = await Promise.all([
          scoreTransactions(rawTransactions),
          fetchCustomerProfiles(rawTransactions)
        ]);
        setTransactions(txData);
        setCustomerProfiles(profileData);
      } catch (err) {
        setErrorMessage(err.message || 'Failed to fetch transaction scores');
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

  // Sort & Filter customer profiles
  const getProcessedCustomerProfiles = () => {
    let result = [...customerProfiles];

    // 1. Search text filter (Customer ID)
    if (searchText.trim()) {
      const query = searchText.toLowerCase();
      result = result.filter(profile => 
        profile.customer_id.toLowerCase().includes(query)
      );
    }

    // 2. Risk Level filter
    if (riskFilter !== 'All') {
      result = result.filter(profile => profile.overall_risk_level === riskFilter);
    }

    // 3. Sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      if (customerSortKey === 'customer_id') {
        comparison = a.customer_id.localeCompare(b.customer_id);
      } else if (customerSortKey === 'overall_risk_level') {
        const priorityA = RISK_PRIORITY[a.overall_risk_level] || 0;
        const priorityB = RISK_PRIORITY[b.overall_risk_level] || 0;
        comparison = priorityA - priorityB;
        if (comparison === 0) {
          comparison = a.overall_risk_score - b.overall_risk_score;
        }
      } else if (customerSortKey === 'overall_risk_score') {
        comparison = a.overall_risk_score - b.overall_risk_score;
      } else if (customerSortKey === 'total_transactions') {
        comparison = a.total_transactions - b.total_transactions;
      } else if (customerSortKey === 'flagged_transactions') {
        comparison = a.flagged_transactions - b.flagged_transactions;
      } else if (customerSortKey === 'total_amount') {
        comparison = a.total_amount - b.total_amount;
      }

      return customerSortDirection === 'asc' ? comparison : -comparison;
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

  const handleCustomerSortChange = (key) => {
    if (customerSortKey === key) {
      setCustomerSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setCustomerSortKey(key);
      setCustomerSortDirection('desc'); // Default to descending
    }
  };

  const clearFilters = () => {
    setSearchText('');
    setRiskFilter('All');
    setSortKey('risk_level');
    setSortDirection('desc');
    setCustomerSortKey('overall_risk_score');
    setCustomerSortDirection('desc');
  };

  const isFilterActive = searchText !== '' || riskFilter !== 'All' || sortKey !== 'risk_level' || sortDirection !== 'desc' || customerSortKey !== 'overall_risk_score' || customerSortDirection !== 'desc';
  
  const processedTransactions = getProcessedTransactions();
  const processedCustomerProfiles = getProcessedCustomerProfiles();

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

        {/* Dynamic Summary Metric Cards */}
        <SummaryCards transactions={transactions} />

        {/* Risk Distribution Profile Chart */}
        <RiskDistribution transactions={processedTransactions} />

        {/* Tab Switcher */}
        <div className="tab-container">
          <button 
            className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Transactions ({transactions.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Customer Profiles ({customerProfiles.length})
          </button>
        </div>

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
                placeholder={activeTab === 'transactions' ? "Search by Transaction or Customer ID..." : "Search by Customer ID..."}
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

          {activeTab === 'transactions' ? (
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
          ) : (
            <div className="sort-group">
              <span className="sort-label">Sort Priority:</span>
              <select 
                className="dropdown-filter"
                value={customerSortKey}
                onChange={(e) => handleCustomerSortChange(e.target.value)}
              >
                <option value="overall_risk_score">Risk Score</option>
                <option value="overall_risk_level">Risk Level</option>
                <option value="customer_id">Customer ID</option>
                <option value="total_transactions">Total Txns</option>
                <option value="flagged_transactions">Flagged Txns</option>
                <option value="total_amount">Total Amount</option>
              </select>
            </div>
          )}
        </div>

        {/* Toggle table depending on activeTab */}
        {activeTab === 'transactions' ? (
          <TransactionTable 
            transactions={processedTransactions} 
            isLoading={isLoading}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
          />
        ) : (
          <CustomerProfileTable 
            profiles={processedCustomerProfiles}
            isLoading={isLoading}
            sortKey={customerSortKey}
            sortDirection={customerSortDirection}
            onSortChange={handleCustomerSortChange}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        FraudGuard Security Dashboard &bull; Hackathon Project &bull; Person 6 UI Dev Integration
      </footer>
    </div>
  );
}

