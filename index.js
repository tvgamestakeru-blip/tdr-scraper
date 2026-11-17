const cron = require('node-cron');
const fetch = require('node-fetch');

// ご自身のGoogle Apps Scriptの「ウェブアプリのURL」
const GAS_POST_URL = "https://script.google.com/macros/s/AKfycbyWBaf-t4LYLBuXhx1l20Q630Pfw6rD-vPh9ySNDSNfh2wBpRwdNzvlFo-lX1pNCxhJEQ/exec";

const TARGETS = [
  { type: "TDS_Attraction",  url: "https://www.tokyodisneyresort.jp/_/realtime/tds_attraction.json" },
  { type: "TDL_Attraction",  url: "https://www.tokyodisneyresort.jp/_/realtime/tdl_attraction.json" },
  { type: "TDS_Restaurant",  url: "https://www.tokyodisneyresort.jp/_/realtime/tds_restaurant.json" },
  { type: "TDL_Restaurant",  url: "https://www.tokyodisneyresort.jp/_/realtime/tdl_restaurant.json" },
  { type: "TDS_ParadeShow",  url: "https://www.tokyodisneyresort.jp/_/realtime/tds_parade_show.json" },
  { type: "TDL_ParadeShow",  url: "https://www.tokyodisneyresort.jp/_/realtime/tdl_parade_show.json" }
];

async function scrapeAndSend() {
  console.log(`[${new Date().toLocaleTimeString()}] TDRデータの取得を開始...`);
  
  for (const target of TARGETS) {
    try {
      const res = await fetch(target.url + "?_=" + new Date().getTime(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      if (res.ok) {
        const jsonData = await res.json();
        await fetch(GAS_POST_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: target.type, data: jsonData })
        });
        console.log(`-> ${target.type}: 送信成功`);
      } else {
        console.warn(`-> ${target.type}: データ取得失敗 (Status: ${res.status})`);
      }
    } catch (err) {
      console.error(`-> ${target.type} エラー:`, err.message);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}

cron.schedule('* * * * *', () => {
  scrapeAndSend();
});

console.log("TDR 自動スクレイパーが起動しました（1分おきに常時稼働中）");

// --- Renderのスリープ防止用簡易サーバー ---
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('TDR Scraper is alive!\n');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Keep-alive server is running on port ${PORT}`);
});
