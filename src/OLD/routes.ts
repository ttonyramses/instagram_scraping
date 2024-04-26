import { createPlaywrightRouter, sleep } from 'crawlee';

export const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ enqueueLinks, log }) => {
    log.info(`enqueueing new URLs`);
    //await sleep(30_000);
    await enqueueLinks({
        globs: ['https://www.instagram.com/jacoby_pio/', 'https://www.instagram.com/edele_mln/', 'https://www.instagram.com/jeanclaude.mendes/'  ],
        label: 'detail',
        
    });

});

router.addHandler('detail', async ({ request, page, log, pushData }) => {
    const title = await page.title();
    log.info(`${title}`, { url: request.loadedUrl });

    await pushData({
        url: request.loadedUrl,
        title,
    });
});
