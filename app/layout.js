export const metadata = {
  title: 'Out of Office',
  description: 'Request time out of the office',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
