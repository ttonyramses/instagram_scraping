import { chromium, Page } from 'playwright';

async function autoScroll(page: Page) {
    const startTime = Date.now();
    const duration = 20 * 60 * 1000; // 20 minutes en millisecondes
    let lastLoggedTime = Date.now();

    while (Date.now() < startTime + duration) {
        // Logique de défilement vers le bas
        await page.mouse.wheel(0, 1000);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Pause de 5 secondes

        // Logique de défilement vers le haut
        await page.mouse.wheel(0, -1000);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Pause de 5 secondes

        // Log chaque minute
        if (Date.now() - lastLoggedTime >= 60000) {
            console.log('Another minute has passed');
            lastLoggedTime = Date.now();
        }
    }
}

async function main() {
    const browser = await chromium.launch({ headless: false }); // Mode non headless pour visualiser le défilement
    const page = await browser.newPage();
    await page.goto('https://example.com'); // Remplacez par l'URL désirée

    await autoScroll(page);

    await browser.close();
}

main().catch(console.error);
