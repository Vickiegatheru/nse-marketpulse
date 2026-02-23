import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function generateMockHistory(currentPrice) {
  const data = [];
  let price = currentPrice * 0.85; 
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: parseFloat(price.toFixed(2))
    });

    const volatility = currentPrice * 0.03;
    price = price + (Math.random() * volatility * 2) - volatility;
  }
  data[data.length - 1].price = currentPrice; 
  return data;
}

function StockDetail() {
  const { ticker } = useParams();
  const navigate = useNavigate();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const response = await fetch('https://nse-marketpulse.onrender.com/api/stocks');
        const result = await response.json();
        const foundStock = result.data.find(s => s.ticker === ticker);
        setStock(foundStock);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStock();
  }, [ticker]);

  const chartData = useMemo(() => {
    if (stock) return generateMockHistory(stock.price);
    return [];
  }, [stock]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-800">Stock Not Found</h2>
        <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold">
          Back to Market
        </button>
      </div>
    );
  }

  const isPositive = stock.change.includes('+');
  const strokeColor = isPositive ? '#16a34a' : '#ef4444';
  const fillColor = isPositive ? '#dcfce7' : '#fee2e2';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto p-6">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors mb-6"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
          
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">{stock.ticker}</h1>
              <p className="text-lg text-gray-500 font-medium mt-1">{stock.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Current Price</p>
              <div className="flex items-baseline justify-end gap-1 mt-1">
                <span className="text-lg font-bold text-gray-400">KES</span>
                <span className="text-4xl font-black text-gray-900">{stock.price.toFixed(2)}</span>
              </div>
              <span className={`inline-block mt-2 px-3 py-1 rounded-lg text-sm font-bold ${
                isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {stock.change} Today
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 mt-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">30-Day Price Trend (Simulated)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} minTickGap={30} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#111827', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="price" stroke={strokeColor} strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StockDetail;