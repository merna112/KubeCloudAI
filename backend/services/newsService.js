const Parser = require('rss-parser');
const parser = new Parser({ timeout: 5000 });

const TECH_FEEDS = [
    'https://www.infoq.com/feed',
    'https://techcrunch.com/feed/',
    'https://feeds.feedburner.com/TheHackersNews',
    'https://venturebeat.com/category/ai/feed/',
    'https://aws.amazon.com/blogs/aws/feed/',
    'https://azurecomcdn.azureedge.net/en-us/updates/feed/',
    'https://cloud.google.com/blog/feed',
    'https://kubernetes.io/feed.xml',
    'https://devops.com/feed/',
    'https://dzone.com/rss.xml'
];

async function getLatestTechNews(keyword) {
    const allItems = [];
    const feedPromises = TECH_FEEDS.map(async (feedUrl) => {
        try {
            const feed = await parser.parseURL(feedUrl);
            feed.items.forEach(item => {
                let match = false;
                if (keyword) {
                    const lowerKeyword = keyword.toLowerCase();
                    if ((item.title && item.title.toLowerCase().includes(lowerKeyword)) ||
                        (item.contentSnippet && item.contentSnippet.toLowerCase().includes(lowerKeyword)) ||
                        (item.content && typeof item.content === 'string' && item.content.toLowerCase().includes(lowerKeyword)) ||
                        (item.categories && Array.isArray(item.categories) && item.categories.some(cat => typeof cat === 'string' && cat.toLowerCase().includes(lowerKeyword)))) {
                        match = true;
                    }
                } else {
                    match = true;
                }
                if (match) {
                     allItems.push({ 
                        title: item.title || 'No Title', 
                        link: item.link || '#', 
                        date: item.isoDate || item.pubDate || new Date().toISOString(),
                        snippet: item.contentSnippet || (typeof item.content === 'string' ? item.content.substring(0,150) + '...' : 'No snippet available'),
                        source: 'rss_feed'
                    });
                }
            });
        } catch (error) {
            // Silent error for timeout or feed fetch failure
        }
    });

    await Promise.allSettled(feedPromises);

    allItems.sort((a, b) => new Date(b.date) - new Date(a.date));
    return allItems.slice(0, 3);
}

module.exports = { getLatestTechNews };