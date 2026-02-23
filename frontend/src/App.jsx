import { useState, useEffect } from 'react';

function App() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('market');

  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem('nse_watchlist');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/stocks');
        const result = await response.json();
        setStocks(result.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, []);

  useEffect(() => {
    localStorage.setItem('nse_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const toggleWatchlist = (ticker) => {
    setWatchlist((prev) =>
      prev.includes(ticker) ? prev.filter((t) => t !== ticker) : [...prev, ticker]
    );
  };

  const filteredStocks = stocks.filter((stock) => {
    const matchesSearch =
      stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === 'watchlist' ? watchlist.includes(stock.ticker) : true;

    return matchesSearch && matchesTab;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xl font-bold text-gray-600">Syncing Market Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto p-6">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">MarketPulse</h1>
              <p className="text-sm text-gray-500 mt-1 font-medium">Nairobi Securities Exchange</p>
            </div>

            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('market')}
                className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
                  activeTab === 'market' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                All Stocks
              </button>
              <button
                onClick={() => setActiveTab('watchlist')}
                className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
                  activeTab === 'watchlist' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                My Watchlist
              </button>
            </div>
            
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
              <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </header>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 mt-4">
        {filteredStocks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500 text-lg font-medium">
              {activeTab === 'watchlist' && searchTerm === '' 
                ? "Your watchlist is empty. Click the star icon on any stock to add it."
                : `No stocks found matching "${searchTerm}"`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredStocks.map((stock) => (
              <div key={stock.ticker} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{stock.ticker}</h2>
                    <p className="text-xs text-gray-500 truncate max-w-[140px] mt-0.5">{stock.name}</p>
                  </div>
                  <button 
                    onClick={() => toggleWatchlist(stock.ticker)}
                    className="p-1.5 rounded-full hover:bg-gray-50 transition-colors focus:outline-none"
                  >
                    <svg 
                      className={`w-6 h-6 ${watchlist.includes(stock.ticker) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-semibold text-gray-400">KES</span>
                    <span className="text-2xl font-black text-gray-900">{stock.price.toFixed(2)}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    stock.change.includes('+') ? 'bg-green-50 text-green-700' : 
                    stock.change.includes('-') ? 'bg-red-50 text-red-700' : 
                    'bg-gray-50 text-gray-700'
                  }`}>
                    {stock.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;