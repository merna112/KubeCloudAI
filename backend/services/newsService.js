const Parser = require('rss-parser');
const parser = new Parser();

const TECH_FEEDS = [
    'https://www.infoq.com/feed',
    'https://techcrunch.com/feed/',
    'https://feeds.feedburner.com/TheHackersNews',
    'https://www.bleepingcomputer.com/feed/',
    'https://www.wired.com/feed/category/security/latest/rss',
    'https://www.darkreading.com/rss_simple.asp',
    'https://krebsonsecurity.com/feed/',
    'https://threatpost.com/feed/',
    'https://venturebeat.com/category/ai/feed/',
    'https://aws.amazon.com/blogs/aws/feed/',
    'https://azurecomcdn.azureedge.net/en-us/updates/feed/',
    'https://cloud.google.com/blog/feed',
    'https://kubernetes.io/feed.xml',
    'https://www.docker.com/blog/feed/',
    'https://www.ansible.com/blog/feed',
    'https://www.hashicorp.com/blog/feed.xml',
    'https://about.gitlab.com/atom.xml',
    'https://www.jenkins.io/atom.xml',
    'https://www.atlassian.com/blog/feed',
    'https://www.infoworld.com/category/devops/index.rss',
    'https://devops.com/feed/',
    'https://dzone.com/rss.xml'
];

async function getLatestTechNews(keyword) {
    const allItems = [];
    for (const feedUrl of TECH_FEEDS) {
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
                        snippet: item.contentSnippet || (typeof item.content === 'string' ? item.content.substring(0,150) + '...' : 'No snippet available')
                    });
                }
            });
        } catch (error) {
            console.error(`Error fetching RSS feed ${feedUrl}:`, error.message);
        }
    }
    allItems.sort((a, b) => new Date(b.date) - new Date(a.date));
    return allItems.slice(0, 5);
}

module.exports = { getLatestTechNews };