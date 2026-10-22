import '../styles.css';

export const metadata = {
  title: 'AI Reel Generator',
  description: 'Professional typography reels from voice + word timing.',
};

export default function RootLayout({children}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
