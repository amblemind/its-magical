import puppeteer from 'puppeteer';

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
export default async function handler(req, res) {

  let browser, page = null;
  const url = req.query.url;

  // Perform URL validation
	if (!url || !url.trim()) {
		return res.status(400).json({
			error: 'Enter a valid URL'
		})
	}

  try {

    if(page) await page.close();
    if(browser) await browser.close();

    console.log("connecting to browser");

    browser = await puppeteer.launch();
    page = await browser.newPage();
    await page.setViewport({
      width: 1980,
      height: 1080,
    });

    console.log("navigating to page");
    await page.goto(url, {waitUntil: 'networkidle2'});

    await page.waitForTimeout(250);
    const buffer = await page.screenshot({fullPage: false});

    console.log("returning screenshot");
    return res.status(200).send(buffer);

	} catch (error) {

		console.log(error)
		return res.status(400).json({
			error: error.message || 'Something went wrong'
		})

	} finally {

		if (browser !== null) {
			await browser.close()
		}
	}
}
