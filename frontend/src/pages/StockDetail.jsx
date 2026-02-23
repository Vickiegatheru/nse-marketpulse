import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function StockDetail() {
  const { ticker } = useParams();
  const navigate = useNavigate();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/stocks');
        const result = await response.json();
        const foundStock = result.data.find(s => s.ticker === ticker);
        setStock(foundStock);
      } catch (error) {
        console.error("Sync failed:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStock();
    
    // AUTO-POLLING: Fetch fresh data every 60 seconds
    const intervalId = setInterval(fetchStock, 60000); 
    return () => clearInterval(intervalId);
  }, [ticker]);

  const chartData = useMemo(() => {
    if (!stock) return [];
    const data = [];
    let simulatedPrice = stock.price * 0.85; 
    const today = new Date();

    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      if (i === 0) {
        simulatedPrice = stock.price;
      } else {
        const volatility = stock.price * 0.03;
        simulatedPrice = simulatedPrice + (Math.random() * volatility * 2 - volatility);
      }
      data.push({
        date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        price: Number(simulatedPrice.toFixed(2))
      });
    }
    return data;
  }, [stock]);

  const orderBook = useMemo(() => {
    if (!stock) return { bids: [], asks: [] };
    const p = stock.price;
    return {
      asks: [
        { price: (p + 0.15).toFixed(2), size: Math.floor(Math.random() * 5000) + 100 },
        { price: (p + 0.10).toFixed(2), size: Math.floor(Math.random() * 5000) + 100 },
        { price: (p + 0.05).toFixed(2), size: Math.floor(Math.random() * 5000) + 100 },
      ].reverse(),
      bids: [
        { price: (p - 0.05).toFixed(2), size: Math.floor(Math.random() * 5000) + 100 },
        { price: (p - 0.10).toFixed(2), size: Math.floor(Math.random() * 5000) + 100 },
        { price: (p - 0.15).toFixed(2), size: Math.floor(Math.random() * 5000) + 100 },
      ]
    };
  }, [stock]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center mt-32">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center mt-32">
        <h2 className="text-2xl font-bold text-gray-800">Stock Not Found</h2>
        <button onClick={() => navigate('/')} className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold">
          Return to Market
        </button>
      </div>
    );
  }

  const isPositive = stock.change.includes('+');
  const chartColor = isPositive ? '#16a34a' : '#dc2626'; 

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="max-w-6xl mx-auto p-6">
        <button onClick={() => navigate('/')} className="flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors mb-6">
          &larr; Back to Dashboard
        </button>

        <div className="bg-white p-8 rounded-2xl border border-gray-200 mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shadow-sm">
          <div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tight">{stock.ticker}</h1>
            <p className="text-lg text-gray-500 font-bold mt-1">{stock.name}</p>
          </div>
          <div className="text-left md:text-right">
            <div className="flex items-baseline md:justify-end gap-2">
              <span className="text-lg font-bold text-gray-400">KES</span>
              <span className="text-5xl font-black text-gray-900 tracking-tight font-mono">{stock.price.toFixed(2)}</span>
            </div>
            <span className={`inline-block mt-3 px-3 py-1 rounded-lg text-sm font-bold ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {stock.change} Today
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">30-Day Market Trend</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 'bold' }} dy={10} />
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 'bold' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderRadius: '12px', border: 'none', color: '#fff' }} 
                    itemStyle={{ color: chartColor, fontWeight: 'bold', fontFamily: 'monospace', fontSize: '18px' }}
                  />
                  <Line type="monotone" dataKey="price" stroke={chartColor} strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} animationDuration={1000} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Key Statistics</h3>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-600">Volume</span>
                <span className="text-base font-black text-gray-900 font-mono">{stock.volume}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-600">Prev Close</span>
                <span className="text-base font-black text-gray-900 font-mono">
                  {(stock.price - parseFloat(stock.change.replace('+', ''))).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-sm font-bold text-gray-600">Exchange</span>
                <span className="text-base font-black text-gray-900">NSE</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex-grow">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Market Depth</h3>
              <div className="flex justify-between text-xs font-bold text-gray-400 uppercase mb-3">
                <span>Ask Size</span>
                <span>Price</span>
              </div>
              <div className="mb-4">
                {orderBook.asks.map((ask, i) => (
                  <div key={i} className="flex justify-between font-mono text-sm py-1">
                    <span className="text-gray-500">{ask.size}</span>
                    <span className="text-red-500 font-bold">{ask.price}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-400 uppercase mb-3 border-t border-gray-100 pt-4">
                <span>Bid Size</span>
                <span>Price</span>
              </div>
              <div>
                {orderBook.bids.map((bid, i) => (
                  <div key={i} className="flex justify-between font-mono text-sm py-1">
                    <span className="text-gray-500">{bid.size}</span>
                    <span className="text-green-600 font-bold">{bid.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default StockDetail;