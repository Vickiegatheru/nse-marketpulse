import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('market');
  const [viewMode, setViewMode] = useState('table');
  const [sortConfig, setSortConfig] = useState({ key: 'ticker', direction: 'asc' });
  const [lastUpdated, setLastUpdated] = useState('');
  const navigate = useNavigate();

  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem('nse_watchlist');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const fetchStocks = async () => {
      try {
      const response = await fetch('https://nse-marketpulse.onrender.com/api/stocks');  
      const result = await response.json();
        setStocks(result.data);
        
        // Format the timestamp cleanly
        const date = new Date(result.timestamp || Date.now());
        setLastUpdated(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (error) {
        console.error("Sync failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStocks(); // Fetch immediately on load

    // AUTO-POLLING: Fetch fresh data every 60 seconds
    const intervalId = setInterval(fetchStocks, 60000); 

    // Cleanup interval when leaving the page
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    localStorage.setItem('nse_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const toggleWatchlist = (e, ticker) => {
    e.stopPropagation();
    setWatchlist((prev) => prev.includes(ticker) ? prev.filter((t) => t !== ticker) : [...prev, ticker]);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const filteredStocks = stocks.filter((stock) => {
    const matchesSearch = stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) || stock.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'watchlist' ? watchlist.includes(stock.ticker) : true;
    return matchesSearch && matchesTab;
  });

  const sortedStocks = [...filteredStocks].sort((a, b) => {
    if (sortConfig.key === 'price') return sortConfig.direction === 'asc' ? a.price - b.price : b.price - a.price;
    if (sortConfig.key === 'change') {
      const valA = parseFloat(a.change.replace('+', '').replace('%', ''));
      const valB = parseFloat(b.change.replace('+', '').replace('%', ''));
      return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
    }
    return sortConfig.direction === 'asc' ? a.ticker.localeCompare(b.ticker) : b.ticker.localeCompare(a.ticker);
  });

  const topGainer = useMemo(() => {
    if (stocks.length === 0) return null;
    return [...stocks].sort((a, b) => parseFloat(b.change.replace('+', '')) - parseFloat(a.change.replace('+', '')))[0];
  }, [stocks]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center mt-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading Market Data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12 bg-gray-50 min-h-screen">
      <div className="bg-blue-900 text-white py-3">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center text-sm font-bold">
          <div className="flex gap-8">
            <span className="opacity-80">Listed: <span className="opacity-100 ml-1">{stocks.length}</span></span>
            {topGainer && (
              <span className="opacity-80 hidden md:inline-block">Top Mover: <span className="text-green-400 ml-1">{topGainer.ticker} {topGainer.change}</span></span>
            )}
          </div>
          <div className="opacity-80 font-mono text-xs">
            Last Updated: {lastUpdated}
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button onClick={() => setActiveTab('market')} className={`px-6 py-2 text-sm font-bold rounded-lg ${activeTab === 'market' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Market</button>
            <button onClick={() => setActiveTab('watchlist')} className={`px-6 py-2 text-sm font-bold rounded-lg ${activeTab === 'watchlist' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Watchlist</button>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <input type="text" placeholder="Search ticker or company..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium transition-all" />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <div className="hidden md:flex bg-gray-100 rounded-xl border border-gray-200 p-1">
              <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              </button>
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 mt-4">
        {sortedStocks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500 text-lg font-bold">No Data Found</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-4 px-6 cursor-pointer hover:text-gray-900" onClick={() => handleSort('ticker')}>Ticker</th>
                  <th className="py-4 px-6">Company</th>
                  <th className="py-4 px-6 text-right cursor-pointer hover:text-gray-900" onClick={() => handleSort('price')}>Price (KES)</th>
                  <th className="py-4 px-6 text-right cursor-pointer hover:text-gray-900" onClick={() => handleSort('change')}>Change</th>
                  <th className="py-4 px-6 text-center">Watch</th>
                </tr>
              </thead>
              <tbody>
                {sortedStocks.map((stock) => (
                  <tr key={stock.ticker} onClick={() => navigate(`/stock/${stock.ticker}`)} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors group">
                    <td className="py-4 px-6 font-black text-gray-900 group-hover:text-blue-600">{stock.ticker}</td>
                    <td className="py-4 px-6 text-sm font-bold text-gray-500 truncate max-w-[200px]">{stock.name}</td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-gray-900 text-lg">{stock.price.toFixed(2)}</td>
                    <td className="py-4 px-6 text-right">
                      <span className={`px-3 py-1 rounded-lg text-sm font-bold ${stock.change.includes('+') ? 'bg-green-100 text-green-700' : stock.change.includes('-') ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                        {stock.change}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button onClick={(e) => toggleWatchlist(e, stock.ticker)} className="focus:outline-none p-2 rounded-full hover:bg-white border border-transparent hover:border-gray-200">
                        <svg className={`w-5 h-5 mx-auto ${watchlist.includes(stock.ticker) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
             {sortedStocks.map((stock) => (
              <div key={stock.ticker} onClick={() => navigate(`/stock/${stock.ticker}`)} className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 group-hover:text-blue-600">{stock.ticker}</h2>
                    <p className="text-sm text-gray-500 truncate max-w-[140px] font-bold mt-1">{stock.name}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-sm font-bold ${stock.change.includes('+') ? 'bg-green-100 text-green-700' : stock.change.includes('-') ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                    {stock.change}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-gray-400">KES</span>
                  <span className="text-3xl font-black text-gray-900 font-mono">{stock.price.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;