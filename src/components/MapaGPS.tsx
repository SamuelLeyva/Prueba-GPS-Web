'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Navigation, Crosshair } from 'lucide-react';

// Importar dinámicamente para evitar SSR issues con Leaflet
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export default function MapaGPS() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [L, setL] = useState<any>(null);

  // Cargar Leaflet dinámicamente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((leaflet) => {
        setL(leaflet.default);
        
        // Configurar iconos por defecto
        delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl;
        leaflet.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
      });
    }
  }, []);

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Verificar permisos de geolocalización
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionGranted(result.state === 'granted');
        result.addEventListener('change', () => {
          setPermissionGranted(result.state === 'granted');
        });
      });
    }
  }, []);

  // Solicitar ubicación
  const getCurrentLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      setLoading(false);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: LocationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        setLocation(newLocation);
        setPermissionGranted(true);
        setLoading(false);
        setMapReady(true);
      },
      (error) => {
        let errorMessage = 'Error al obtener la ubicación';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso de geolocalización denegado. Por favor, permite el acceso a tu ubicación.';
            setPermissionGranted(false);
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Información de ubicación no disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado al obtener la ubicación';
            break;
        }
        setError(errorMessage);
        setLoading(false);
      },
      options
    );
  };

  // Iniciar seguimiento automático
  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: LocationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        setLocation(newLocation);
        setPermissionGranted(true);
      },
      (error) => {
        console.error('Error en seguimiento:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            🗺️ GPS Mapa
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {isMobile ? 'Aplicación móvil con GPS en tiempo real' : 'Versión escritorio - GPS desde navegador'}
          </p>
        </div>

        {/* Panel de control */}
        <Card className="mb-4 p-4 bg-white shadow-lg">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                onClick={getCurrentLocation}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Crosshair className="h-4 w-4" />
                )}
                {loading ? 'Obteniendo...' : 'Mi Ubicación'}
              </Button>

              {location && (
                <Button
                  onClick={startTracking}
                  variant="outline"
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <Navigation className="h-4 w-4" />
                  Seguimiento
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Badge variant={isMobile ? "default" : "secondary"}>
                {isMobile ? '📱 Móvil' : '💻 Escritorio'}
              </Badge>
              {permissionGranted !== null && (
                <Badge variant={permissionGranted ? "default" : "destructive"}>
                  {permissionGranted ? '✅ GPS Activo' : '❌ GPS Inactivo'}
                </Badge>
              )}
            </div>
          </div>

          {/* Información de ubicación */}
          {location && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-800">Ubicación actual</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Latitud:</span>
                  <span className="ml-2 font-mono">{location.lat.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Longitud:</span>
                  <span className="ml-2 font-mono">{location.lng.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Precisión:</span>
                  <span className="ml-2">{Math.round(location.accuracy)}m</span>
                </div>
                <div>
                  <span className="text-gray-600">Actualizado:</span>
                  <span className="ml-2">{new Date(location.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Mensajes de error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
              {isMobile && permissionGranted === false && (
                <p className="text-red-600 text-xs mt-2">
                  Para usar esta app, ve a Configuración → Permisos → Ubación y permite el acceso.
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Mapa */}
        <Card className="overflow-hidden shadow-lg" style={{ height: isMobile ? '60vh' : '70vh' }}>
          {mapReady && location && L ? (
            <div className="w-full h-full">
              <MapContainer
                center={[location.lat, location.lng]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                zoomControl={!isMobile}
              >
                <TileLayer
                  attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[location.lat, location.lng]}>
                  <Popup>
                    <div className="text-center">
                      <p className="font-semibold">Tu ubicación actual</p>
                      <p className="text-sm text-gray-600">
                        Lat: {location.lat.toFixed(6)}<br />
                        Lng: {location.lng.toFixed(6)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center p-6">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Mapa GPS
                </h3>
                <p className="text-gray-600 mb-4">
                  {isMobile 
                    ? 'Presiona "Mi Ubicación" para activar el GPS y ver tu posición en el mapa'
                    : 'Presiona "Mi Ubicación" para ver tu posición actual en el mapa'
                  }
                </p>
                {isMobile && (
                  <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded-lg">
                    <p>⚠️ Se requiere permiso de ubicación para funcionar correctamente</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Instrucciones móviles */}
        {isMobile && (
          <Card className="mt-4 p-4 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">📱 Instrucciones para Android</h3>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Presiona "Mi Ubicación" para solicitar permiso de GPS</li>
              <li>2. Acepta el permiso cuando el navegador lo solicite</li>
              <li>3. Espera unos segundos mientras se obtiene tu ubicación</li>
              <li>4. Tu posición aparecerá marcada en el mapa</li>
              <li>5. Usa "Seguimiento" para actualizar tu posición en tiempo real</li>
            </ol>
          </Card>
        )}
      </div>
    </div>
  );
}