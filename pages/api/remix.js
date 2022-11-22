import chromium from 'chrome-aws-lambda'
import AWS from 'aws-sdk'

const S3 = new AWS.S3({
	accessKeyId: 'AKIAY7CVSRSPP533I7F2',
	secretAccessKey: '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'
});

async function getBrowserInstance() {
	const executablePath = await chromium.executablePath

	if (!executablePath) {
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

export default async function handler(req, res) {

	let browser, page = null;
	const url = req.body.url;

	// Perform URL validation
	if (!url || !url.trim()) {
		return res.status(400).json({
			error: 'Enter a valid URL'
		})
	}

	try {

		if (page) await page.close();
		if (browser) await browser.close();

		console.log("connecting to browser");
		browser = await getBrowserInstance();
		page = await browser.newPage();

		console.log("navigating to page");
		await page.goto(url, { waitUntil: 'networkidle2' });
		await page.waitForTimeout(250);

		console.log("taking screenshot");
		const imageBuffer = await page.screenshot({ fullPage: false });

		// upload to S3
		const fileName = 'its_magical_' + Date.now() + '.png';
		S3.upload({
			Bucket: 'its-magical',
			Key: fileName,
			Body: imageBuffer
		}, (error, data) => {
			if (error) {
				console.log(error)
				return res.status(500).json({
					error: 'Something went wrong'
				})
			}

			const signedURL = S3.getSignedUrl('getObject', {
				Bucket: 'its-magical',
				Key: fileName,
				Expires: 60
			})

			console.log(signedURL);
			return res.status(200).json({
				url: signedURL
			})
		})


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
