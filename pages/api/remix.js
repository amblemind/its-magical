import chromium from 'chrome-aws-lambda'


async function getBrowserInstance() {
	const executablePath = await chromium.executablePath

	if (!executablePath) {
		// running locally
		const puppeteer = require('puppeteer')
		return puppeteer.launch({
			args: chromium.args,
			headless: true,
			defaultViewport: {
				width: 1280,
				height: 720
			},
			ignoreHTTPSErrors: true
		})
	}

	return chromium.puppeteer.launch({
		args: chromium.args,
		defaultViewport: {
			width: 1280,
			height: 720
		},
		executablePath,
		headless: chromium.headless,
		ignoreHTTPSErrors: true
	})
}

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

    browser = await getBrowserInstance();
    page = await browser.newPage();

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
