const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = 5000;
const URL = 'https://afx.kwayisi.org/nse/';

let cache = { data: [], lastUpdated: 0 };
// Reduced cache to 60 seconds for near real-time updates
const CACHE_DURATION = 60000; 

async function scrapeNSE() {
    try {
        const { data } = await axios.get(URL);
        const $ = cheerio.load(data);
        const stocks = [];

        $('table tbody tr').each((i, el) => {
            const tds = $(el).find('td');
            if (tds.length >= 5) {
                const ticker = $(tds[0]).text().trim();
                const name = $(tds[1]).text().trim();
                const volume = $(tds[2]).text().trim() || '0';
                const priceText = $(tds[3]).text().trim();
                const change = $(tds[4]).text().trim();

                const price = parseFloat(priceText.replace(/,/g, ''));

                if (ticker && !isNaN(price)) {
                    stocks.push({ ticker, name, volume, price, change });
                }
            }
        });
        return stocks;
    } catch (error) {
        return [];
    }
}

app.get('/api/stocks', async (req, res) => {
    const now = Date.now();
    
    if (cache.data.length > 0 && (now - cache.lastUpdated < CACHE_DURATION)) {
        return res.json({ source: 'cache', timestamp: cache.lastUpdated, data: cache.data });
    }

    const freshData = await scrapeNSE();
    
    if (freshData.length > 0) {
        cache.data = freshData;
        cache.lastUpdated = now;
        return res.json({ source: 'live', timestamp: now, data: freshData });
    }
    
    return res.json({ source: 'stale', timestamp: cache.lastUpdated, data: cache.data });
});

app.listen(PORT, () => console.log(`API running on port ${PORT}`));