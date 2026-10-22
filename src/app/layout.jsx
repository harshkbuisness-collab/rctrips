import '@fontsource/inter/400.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/anton/400.css';
import '@fontsource/oswald/700.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/caveat/700.css';
import '../styles.css';

export const metadata = {
  title: 'AI Reel Generator v1.9.5 — Reference Motion Engine',
  description: 'Reference-style AI Reel Generator with flat backgrounds, editorial typography, semantic visual resets and secure Remotion rendering.',
};

export default function RootLayout({children}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
