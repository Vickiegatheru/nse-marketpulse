import { useState, useEffect } from 'react';

function App() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-bold text-gray-600">Loading NSE Data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">NSE MarketPulse</h1>
        <p className="text-gray-500">Live tracker for the Nairobi Securities Exchange</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stocks.map((stock) => (
          <div key={stock.ticker} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{stock.ticker}</h2>
                <p className="text-sm text-gray-500 truncate max-w-[150px]">{stock.name}</p>
              </div>
              <span className={`px-2 py-1 rounded text-sm font-medium ${stock.change.includes('+') ? 'bg-green-100 text-green-700' : stock.change.includes('-') ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                {stock.change}
              </span>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-gray-900">KES {stock.price.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;