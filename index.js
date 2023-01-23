const puppeteer = require('puppeteer');
const fs = require('fs');
const { TIMEOUT } = require('dns');
const data = JSON.parse(fs.readFileSync('data.json'));

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://aeon.co/videos',{timeout:60000});

  // Get the href attributes of all the a tags with the .ThreeUp-sc-1ttdvtz-0 class
  const blogLinks = await page.evaluate(() => {
    const links = document.querySelectorAll('.ThreeUp-sc-1ttdvtz-0 a');

    return Array.from(links).map((a) => a.getAttribute('href'));
  });

  // Visit each link and scrape the src attribute of the iframe element
  for (const link of blogLinks) {
    try {
      await page.goto('https://aeon.co/' + link);

      const title = await page.evaluate(() => {
        const iframe = document
          .querySelector('.videos__FluidContainer-sc-1hq037t-2 iframe')
          .getAttribute('title');
        return iframe;
      });

      const vsrc = await page.evaluate(() => {
        const iframe = document
          .querySelector('.videos__FluidContainer-sc-1hq037t-2 iframe')
          .getAttribute('src');
        

        if (iframe.includes('youtube')) {
          return (
            'https://www.youtube.com/watch?v=' +
            iframe.split('/')[4].split('?')[0]
          );
        }
        if (iframe.includes('vimeo')) {
          return 'https://vimeo.com/' + iframe.split('video/')[1].split('?')[0];
        }
        return iframe;
      });

      const pub = await page.evaluate(() => {
        const iframe = document.querySelector(
          '.videos__PublishedDate-sc-1hq037t-11'
        ).innerText;
        return iframe;
      });
      const bsrc = 'https://aeon.co/' + link;

      const thumbnail = await page.evaluate(() => {
        const url = document.querySelector(
          '.VideoPlayer__FallbackImage-sc-1kooncr-0').getAttribute("src");
        return url
      });

      const item = data.find((item) => item.vsrc === vsrc);
      if(!item) data.push({ pub, title, vsrc, bsrc, thumbnail });
      
    } catch (error) {
      console.error(error);
    }
  }

  console.log(data);

  fs.writeFileSync('data.json', JSON.stringify(data));
  await browser.close();
})();