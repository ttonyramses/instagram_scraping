import cookies from './cookies.json' assert { type: 'json'};

// For more information, see https://crawlee.dev/
import { PlaywrightCrawler, sleep, ProxyConfiguration } from 'crawlee';

import { router } from './routes.js';

const startUrls = ['https://www.instagram.com'];

const crawler = new PlaywrightCrawler({
    // proxyConfiguration: new ProxyConfiguration({ proxyUrls: ['...'] }),
    preNavigationHooks: [
        async (crawlingContext, gotoOptions) => {
            const { page } = crawlingContext;
            
          const context =  crawlingContext.page.context();
          context.addCookies(cookies);
          context.grantPermissions(['notifications'], {origin: 'https://www.instagram.com'})
            
        },
    ],
    
    requestHandler: router,

    headless: false,
    // Comment this option to scrape the full website.
    maxRequestsPerCrawl: 20,
});

await crawler.run(startUrls);
