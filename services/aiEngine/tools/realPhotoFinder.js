/**
 * Tool: Tìm ảnh thực tế có nguồn của người thật / cầu thủ nổi tiếng (Messi, Ronaldo, Neymar...)
 * Sử dụng Wikipedia & Wikimedia Commons API chính thức.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function searchRealPhoto(personName, context = '') {
  try {
    const query = personName.trim();
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=5&prop=pageimages|extracts&piprop=original|thumbnail&pithumbsize=1000&exintro=1&explaintext=1&format=json`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'RaphinhaAIPro/2.0 (https://raphinha-goal.local; contact@raphinha.local)'
      }
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Wikipedia API error: ${res.status}`);
    }

    const data = await res.json();
    const pages = Object.values(data.query?.pages || {});

    // Tìm trang có ảnh phù hợp
    let chosenPage = null;
    for (const p of pages) {
      if (p.original || p.thumbnail) {
        chosenPage = p;
        break;
      }
    }

    if (!chosenPage) {
      return {
        found: false,
        message: `Không tìm thấy ảnh tư liệu thực tế của "${query}".`
      };
    }

    const photoUrl = chosenPage.original?.source || chosenPage.thumbnail?.source;
    const title = chosenPage.title || query;
    const snippet = chosenPage.extract ? chosenPage.extract.slice(0, 160) + '...' : '';
    const fileHash = crypto.randomBytes(4).toString('hex');

    // Lưu ảnh vào cache tĩnh nếu cần hoặc trả về URL trực tiếp
    return {
      found: true,
      type: 'real_photo',
      url: photoUrl,
      title: `Ảnh thực tế: ${title}`,
      caption: `Hình ảnh tư liệu thực tế chính thức của ${title} (Nguồn: Wikimedia Commons)`,
      sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`,
      snippet: snippet,
      downloadName: `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${fileHash}.jpg`
    };
  } catch (err) {
    console.error('Lỗi tìm ảnh thực tế:', err.message);
    return {
      found: false,
      error: err.message
    };
  }
}

module.exports = {
  searchRealPhoto
};
