/**
 * SerpApi Service
 * Handles resource discovery via SerpApi with local caching.
 */

const CACHE_PREFIX = 'serp_cache_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

const SerpService = {
    apiKey: '', // Loaded from env or window.ENV

    init(apiKey) {
        this.apiKey = apiKey || window.ENV?.VITE_SERP_API_KEY || '';
    },

    async _fetch(params) {
        if (!this.apiKey) {
            console.warn('SerpApi Key missing. Using mock data.');
            return this._getMockData(params.engine, params.q);
        }

        const queryParams = new URLSearchParams({
            api_key: this.apiKey,
            ...params
        });

        try {
            const response = await fetch(`https://serpapi.com/search?${queryParams.toString()}`);
            if (!response.ok) throw new Error('SerpApi request failed');
            return await response.json();
        } catch (error) {
            console.error('SerpApi Error:', error);
            return this._getMockData(params.engine, params.q);
        }
    },

    async searchYouTube(topic) {
        const cacheKey = `${CACHE_PREFIX}yt_${topic}`;
        const cached = this._getCache(cacheKey);
        if (cached) return cached;

        const results = await this._fetch({
            engine: 'youtube',
            search_query: `${topic} explanation tutorial`
        });

        const formatted = (results.video_results || []).slice(0, 8).map(v => ({
            title: v.title,
            link: v.link,
            channel: v.channel?.name || 'YouTube',
            thumbnail: v.thumbnail?.static || v.thumbnail,
            duration: v.length
        }));

        this._setCache(cacheKey, formatted);
        return formatted;
    },

    async searchLeetCode(topic) {
        const cacheKey = `${CACHE_PREFIX}lc_${topic}`;
        const cached = this._getCache(cacheKey);
        if (cached) return cached;

        // Since SerpApi doesn't have a direct LeetCode engine, we use Google Search engine
        const results = await this._fetch({
            engine: 'google',
            q: `site:leetcode.com/problems "${topic}"`
        });

        const formatted = (results.organic_results || []).slice(0, 8).map(r => ({
            title: r.title.replace(' - LeetCode', ''),
            link: r.link,
            snippet: r.snippet
        }));

        this._setCache(cacheKey, formatted);
        return formatted;
    },

    _getCache(key) {
        const data = localStorage.getItem(key);
        if (!data) return null;
        const parsed = JSON.parse(data);
        if (Date.now() - parsed.timestamp > CACHE_EXPIRY) {
            localStorage.removeItem(key);
            return null;
        }
        return parsed.value;
    },

    _setCache(key, value) {
        localStorage.setItem(key, JSON.stringify({
            value,
            timestamp: Date.now()
        }));
    },

    _getMockData(engine, query) {
        console.log(`Generating mock data for ${engine}: ${query}`);
        if (engine === 'youtube') {
            return {
                video_results: Array.from({ length: 5 }, (_, i) => ({
                    title: `How to master ${query} - Video ${i + 1}`,
                    link: 'https://www.youtube.com/',
                    channel: { name: 'Tech Course' },
                    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg'
                }))
            };
        } else {
            return {
                organic_results: Array.from({ length: 5 }, (_, i) => ({
                    title: `${query} Problem ${i + 1} - LeetCode`,
                    link: 'https://leetcode.com/problems/',
                    snippet: `Master ${query} with this challenging LeetCode problem.`
                }))
            };
        }
    }
};

window.SerpService = SerpService;
