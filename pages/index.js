import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import { useState } from 'react'

export default function Home() {

  const [websiteURL, setWebsiteURL] = useState('')
	const [imageURL, setImageURL] = useState('/placeholder.png')
  const [colorCode, setColorCode] = useState('#fff')

  async function remix() {

    const res = await fetch('/api/remix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: websiteURL,
        color: colorCode
      })
    }).then(res => res.json())

    console.log(res);
    setImageURL(res.url);
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>It&apos;s Magical</title>
        <meta name="description" content="Redesign your " />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://its-magical.vercel.app/">It&apos;s Magical!</a>
        </h1>

        <div className={styles.inputArea}>
          <div>
            <label htmlFor="websiteURL">Step 1: Enter a Website URL</label>
            <input
              class="websiteURL"
              type="text"
              value={websiteURL}
              onChange={(e) => setWebsiteURL(e.target.value)}
              placeholder="Enter a website URL"
            />
          </div>
          <div>
            <label htmlFor="websiteURL">Step 2: Pick a Color ({colorCode})</label>
            <input 
              id="colorCode"
              type="color"
              value={colorCode} 
              onChange={(e) => setColorCode(e.target.value)}
            />
          </div>

          {websiteURL && (colorCode !== '#fff')
            ? <button onClick={remix}>Remix</button> : <small>👆</small>
          }
        </div>
        
        <Image src={imageURL} width={1000} height={563} quality={100} priority alt="your screenshot"/>

      </main>

      <footer className={styles.footer}>
        <a
          href="https://twitter.com/NoCodeDarren"
          target="_blank"
          rel="noopener noreferrer"
        >
          Passion Project by Darren Alderman. &copy; AmbleMind LLC
        </a>
      </footer>
    </div>
  );
}
