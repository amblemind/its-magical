import AWS from 'aws-sdk'

// https://css-tricks.com/converting-color-spaces-in-javascript/#aa-hex-to-hsl
function hexToH(H) {
	// Convert hex to RGB first
	let r = 0, g = 0, b = 0;
	if (H.length == 4) {
	  r = "0x" + H[1] + H[1];
	  g = "0x" + H[2] + H[2];
	  b = "0x" + H[3] + H[3];
	} else if (H.length == 7) {
	  r = "0x" + H[1] + H[2];
	  g = "0x" + H[3] + H[4];
	  b = "0x" + H[5] + H[6];
	}
	// Then to HSL
	r /= 255;
	g /= 255;
	b /= 255;
	let cmin = Math.min(r,g,b),
		cmax = Math.max(r,g,b),
		delta = cmax - cmin,
		h = 0,
		s = 0,
		l = 0;
  
	if (delta == 0)
	  h = 0;
	else if (cmax == r)
	  h = ((g - b) / delta) % 6;
	else if (cmax == g)
	  h = (b - r) / delta + 2;
	else
	  h = (r - g) / delta + 4;
  
	h = Math.round(h * 60);
  
	if (h < 0)
	  h += 360;
  
	l = (cmax + cmin) / 2;
	// s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
	// s = +(s * 100).toFixed(1);
	// l = +(l * 100).toFixed(1);
  
	// return "hsl(" + h + "," + s + "%," + l + "%)";
	return h;
  }

  function generateCss(color) {

	// console.log(hexToHSL(color));
  
	const hue = hexToH(color);
	console.log(hue);
  
	const css = `
	:root {
	  --hue: ${hue}; 
	  --accent-hue: ${hue};
	  --color-normal: hsl(var(--hue), 10%, 62%);
	  --color-light: hsl(var(--hue), 15%, 35%);
	  --color-richer: hsl(var(--hue), 50%, 72%);
	  --color-highlight: hsl(var(--accent-hue), 70%, 45%);
	  --link-color: hsl(var(--hue), 90%, 70%);
	  --accent-color: hsl(var(--accent-hue), 100%, 70%);
	  --error-color: rgb(240, 50, 50);
	  --button-background: hsl(var(--hue), 63%, 43%);
	  --button-text-color: black;
	  --background: hsl(var(--hue), 20%, 12%);
	}
	
	* {
	  color: var(--color-richer) !important;
	  background-color: var(--background) !important;
	  border-color: var(--color) !important;
	  box-shadow: var(--color-light) !important;
	  caret-color: var(--link-color) !important;
	  column-rule-color: var(--color-light) !important;
	  outline-color: var(--color-light) !important;
	  text-decoration-color: var(--color-highlight) !important;
	}
	`;
  
	return css;
  }

export default async function handler(req, res) {

	console.log("start request")

	const url = req.body.url;
	const color = req.body.color;

	console.log(url)

	const S3 = new AWS.S3({
		apiVersion: '2006-03-01',
		accessKeyId: process.env.AWS_ACCESS,
		secretAccessKey: process.env.AWS_SECRET
	});

	const S3_BUCKET = process.env.AWS_BUCKET;

	console.log("bucket: " + S3_BUCKET)

	// Perform URL validation
	if (!url || !url.trim()) {
		return res.status(400).json({
			error: 'Enter a valid URL'
		})
	}

	try {

		console.log("fecthing image")
		// fetch from api with body and headers
		const screenshot = await fetch('https://chrome.browserless.io/screenshot?token=' + process.env.BROWSERLESS_TOKEN, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'no-cache'
			},
			body: JSON.stringify({
				url: url,
				gotoOptions: {
					"waitUntil": "networkidle2",
				},
				waitFor: 0,
				viewport: {
					"width": 1980,
					"height": 1080
				},
				options: {
					"fullPage": false,
					"type": "png"
				},
				addStyleTag: [
					{
					  "content": generateCss(color)
					}
				  ]
			})
		})

		console.log(screenshot)

		const imageBuffer = await screenshot.arrayBuffer()
		

		// upload to S3
		const fileName = 'its_magical_' + Date.now() + '.png';

		console.log("upload to s3")
		await S3.upload({
			Bucket: S3_BUCKET,
			Key: fileName,
			Body: Buffer.from(imageBuffer, 'base64'),
            ContentType: 'image/png',
		}, (err, data) => {

			if (err) {
				console.log(err)
				return res.status(500).json({
					error: 'Something went wrong'
				})	
			}

			console.log(data)

			console.log("creating signed url")
			var params = {Bucket: S3_BUCKET, Key: fileName};
			var signedURL = S3.getSignedUrl('getObject', params);
			console.log(signedURL);

			return res.status(200).json({url: signedURL});
		});

	} catch (error) {

		console.log(error)
		return res.status(400).json({
			error: error.message || 'Something went wrong'
		})

	}
}
