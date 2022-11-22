import AWS from 'aws-sdk'

export default async function handler(req, res) {

	const url = req.body.url;

	const S3 = new AWS.S3({
		apiVersion: '2006-03-01',
		accessKeyId: process.env.AWS_ACCESS,
		secretAccessKey: process.env.AWS_SECRET
	});

	const S3_BUCKET = process.env.AWS_BUCKET;

	// Perform URL validation
	if (!url || !url.trim()) {
		return res.status(400).json({
			error: 'Enter a valid URL'
		})
	}

	try {


		// fetch from api with body and headers
		const response = await fetch('https://chrome.browserless.io/screenshot?token=' + process.env.BROWSERLESS_TOKEN, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'no-cache'
			},
			body: JSON.stringify({
				url: url
			})
		})	

		// get buffer from response
		const imageBuffer = await response.buffer();

		// upload to S3
		const fileName = 'its_magical_' + Date.now() + '.png';

		await S3.upload({
			Bucket: S3_BUCKET,
			Key: fileName,
			Body: imageBuffer
		}, (err, data) => {
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
