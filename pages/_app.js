import { fontVariables } from '../lib/fonts';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <div className={`app ${fontVariables}`}>
      <Component {...pageProps} />
    </div>
  );
}
