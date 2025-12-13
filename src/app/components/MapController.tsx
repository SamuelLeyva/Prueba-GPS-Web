'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';

interface MapControllerProps {
  center: LatLngExpression;
  onLocationFound: (lat: number, lng: number) => void;
}

export default function MapController({ center, onLocationFound }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newCenter: LatLngExpression = [latitude, longitude];
          map.setView(newCenter, 15);
          onLocationFound(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          map.setView(center, 13);
        }
      );
    } else {
      map.setView(center, 13);
    }
  }, [map, center, onLocationFound]);

  return null;
}