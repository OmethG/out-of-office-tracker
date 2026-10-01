import localFont from 'next/font/local';
import './globals.css';

// Fonts are served from this site (no trip to Google), and preloaded.
const sans = localFont({
  src: [
    { path: './fonts/source-sans-3-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/source-sans-3-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: './fonts/source-sans-3-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: './fonts/source-sans-3-latin-800-normal.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
});
const mono = localFont({
  src: [
    { path: './fonts/ibm-plex-mono-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/ibm-plex-mono-latin-500-normal.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-mono',
  display: 'swap',
  preload: false,
});

export const metadata = {
  title: 'MethG Staff',
  description: 'Step-out and leave requests for the MethG team',
  applicationName: 'MethG Staff',
  appleWebApp: { capable: true, title: 'MethG Staff', statusBarStyle: 'default' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f5f6fa',
};

// Light is the default. Runs before the page paints so dark mode never flashes light first.
const themeScript = `try{if(localStorage.getItem('methg-theme')==='dark'){document.documentElement.setAttribute('data-theme','dark')}}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <div className="shell">{children}</div>
      </body>
    </html>
  );
}
