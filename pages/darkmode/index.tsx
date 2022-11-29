import Head from "next/head";
import Image from "next/image";
// import styles from '../styles/Home.module.css';
import { useState } from "react";

export default function DarkMode() {
  const [websiteURL, setWebsiteURL] = useState("");
  const [imageURL, setImageURL] = useState("/placeholder.png");
  const [colorCode, setColorCode] = useState("#fff");
  const [loading, setLoading] = useState(false);

  async function remix() {
    setLoading(true);

    const res = await fetch("/api/remix", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: websiteURL,
        color: colorCode,
      }),
    }).then((res) => res.json());

    console.log(res);
    setImageURL(res.url);
    setLoading(false);
  }

  return (
    <div className="">
      {/* <Head>
        <title>It&apos;s Magical</title>
        <meta name="description" content="Redesign your " />
        <link rel="icon" href="/favicon.ico" />
        <script id="drkmd" src="/client/drkmd.js"></script>
      </Head> */}

      <main className="container flex flex-col">
        <div className="grid grid-cols-2">
          <div className="">
            <h1 className="text-5xl font-bold">
              Welcome to{" "}
              <a href="https://its-magical.vercel.app/">It&apos;s Magical!</a>
            </h1>
            <p>Add darkmode to your website in 99 seconds.</p>
          </div>
          <Image width={100} height={100} src="https://cataas.com/cat"></Image>
        </div>

        <div className="">
          <div>
            <label htmlFor="websiteURL">Step 1: Enter a Website URL</label>
            <input
              className=""
              type="text"
              value={websiteURL}
              onChange={(e) => setWebsiteURL(e.target.value)}
              placeholder="Enter a website URL"
            />
          </div>
          <div>
            <label htmlFor="websiteURL">
              Step 2: Pick a Color ({colorCode})
            </label>
            <input
              id="colorCode"
              type="color"
              value={colorCode}
              onChange={(e) => setColorCode(e.target.value)}
            />
          </div>

          {websiteURL && colorCode !== "#fff" && !loading && (
            <button onClick={remix}>Remix</button>
          )}
          {loading && (
            <p>
              <center>Loading...</center>
            </p>
          )}
        </div>

        <Image
          src={imageURL}
          width={1000}
          height={563}
          quality={100}
          priority
          alt="your screenshot"
        />
      </main>

      {/* <footer className="">
        <a
          href="https://twitter.com/NoCodeDarren"
          target="_blank"
          rel="noopener noreferrer"
        >
          Passion Project by Darren Alderman. &copy; AmbleMind LLC
        </a>
      </footer> */}
    </div>
  );
}
