// Lets staff add MethG Staff to their home screen as an app.
export default function manifest() {
  return {
    name: 'MethG Staff',
    short_name: 'MethG Staff',
    description: 'Step-out and leave requests for the MethG team',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f5f6fa',
    theme_color: '#f5f6fa',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
