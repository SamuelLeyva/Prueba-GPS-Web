import 'leaflet/dist/leaflet.css';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#3b82f6" />
        <title>GPS Mapa - OpenStreetMap</title>
        <meta name="description" content="Aplicación de mapa con GPS para dispositivos móviles usando OpenStreetMap" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}