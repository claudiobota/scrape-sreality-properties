const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');

const data = [];

async function scrapeWebsite(url, currentPage = 1) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });
    const pageContent = await page.content();
    const $ = cheerio.load(pageContent);
    const properties = $('div.property');

    properties.each((index, element) => {
        const $property = $(element);
        const imgUrl = $property.find('img').eq(0).attr('src');
        const localityText = $property.find('span.locality').eq(0).text();

        data.push({
            img: imgUrl,
            title: localityText
        });
    });

    const nextPageLink = $('li.paging-item a').eq(currentPage + 1).attr('href');
    if (nextPageLink && data.length < 100) {
        const nextPageUrl = new URL(nextPageLink, url).href;
        const nextPage = currentPage + 1;
        await scrapeWebsite(nextPageUrl, nextPage);
    } else {
        console.log('Scraping complete.');
    }

    await browser.close();
}

scrapeWebsite('https://www.sreality.cz/en/search/for-sale/apartments/all-countries')
    .then(() => {
        fs.writeFile('data.json', JSON.stringify(data, null, 2), 'utf8', (err) => {
            if (err) {
                console.log(`Error writing JSON file: ${err}`);
            } else {
                console.log('JSON file saved successfully.');
            }
        });
    })
    .catch(error => {
        console.log(`Error: ${error}`);
    });
