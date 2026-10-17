/**
 * Live Search & News Tool
 * Tra cứu thông tin thời sự bóng đá và bách khoa toàn thư trực tuyến có trích dẫn nguồn uy tín.
 */

async function searchLiveInfo(query) {
  const cleanQ = query.trim();
  const searchResults = [];
  const sources = [];

  try {
    // 1. Tìm tin tức mới nhất từ Google News RSS
    const newsKeywords = cleanQ.includes('bóng đá') ? cleanQ : `${cleanQ} football Barcelona`;
    const newsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(newsKeywords)}&hl=vi&gl=VN&ceid=VN:vi`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const newsRes = await fetch(newsUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (newsRes.ok) {
      const xml = await newsRes.text();
      // Phân tích các thẻ <item>
      const itemMatches = [...xml.matchAll(/<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?<\/item>/g)].slice(0, 4);

      itemMatches.forEach(match => {
        let title = match[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
        let link = match[2].trim();
        let pubDate = match[3] ? new Date(match[3]).toLocaleDateString('vi-VN') : 'Gần đây';

        // Tách nguồn tin (thường ở cuối tiêu đề sau dấu gạch ngang)
        let sourceName = 'Báo bóng đá uy tín';
        if (title.includes(' - ')) {
          const parts = title.split(' - ');
          sourceName = parts.pop();
          title = parts.join(' - ');
        }

        searchResults.push({
          title,
          sourceName,
          date: pubDate,
          url: link
        });

        sources.push({
          title: `${title} (${sourceName})`,
          url: link
        });
      });
    }
  } catch (err) {
    console.warn('Google News fetch warning:', err.message);
  }

  // 2. Tra cứu Wikipedia tiếng Việt hoặc tiếng Anh để lấy bối cảnh chính xác
  try {
    const wikiUrl = `https://vi.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQ)}&format=json&utf8=`;
    const wikiRes = await fetch(wikiUrl);
    if (wikiRes.ok) {
      const wikiJson = await wikiRes.json();
      if (wikiJson.query && wikiJson.query.search && wikiJson.query.search.length > 0) {
        const topWiki = wikiJson.query.search[0];
        const cleanSnippet = topWiki.snippet.replace(/<span class="searchmatch">/g, '').replace(/<\/span>/g, '').replace(/&quot;/g, '"');
        searchResults.push({
          title: `Bách khoa toàn thư: ${topWiki.title}`,
          snippet: cleanSnippet,
          sourceName: 'Wikipedia',
          url: `https://vi.wikipedia.org/wiki/${encodeURIComponent(topWiki.title)}`
        });
        sources.push({
          title: `Wikipedia: ${topWiki.title}`,
          url: `https://vi.wikipedia.org/wiki/${encodeURIComponent(topWiki.title)}`
        });
      }
    }
  } catch (err) {
    console.warn('Wiki fetch warning:', err.message);
  }

  return {
    query: cleanQ,
    items: searchResults,
    sources: sources
  };
}

module.exports = {
  searchLiveInfo
};
