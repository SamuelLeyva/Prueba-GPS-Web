'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { LatLngExpression } from 'leaflet';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Plus, Navigation, LogOut, MapPin, DollarSign, FileText } from 'lucide-react';
import Cookies from 'js-cookie';
import 'leaflet/dist/leaflet.css';

// Dynamic import for Leaflet components to avoid SSR issues
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

// Dynamic import for MapController to avoid SSR issues
const MapController = dynamic(
  () => import('./components/MapController').then((mod) => mod.default),
  { ssr: false }
);

// Fix for default markers in Leaflet with Next.js
const createIcon = async () => {
  if (typeof window !== 'undefined') {
    const L = await import('leaflet');
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }
};

interface User {
  username: string;
  phone: string;
  password: string;
}

interface Post {
  id: string;
  title: string;
  description: string;
  price: number;
  lat: number;
  lng: number;
  username: string;
  phone: string;
  timestamp: number;
}

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [userLocation, setUserLocation] = useState<LatLngExpression>([23.1136, -82.3666]); // Default: La Habana
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', description: '', price: '' });

  useEffect(() => {
    const initializeApp = async () => {
      setIsClient(true);
      await createIcon();
      loadPosts();
      checkExistingSession();
    };
    initializeApp();
  }, []);

  const checkExistingSession = () => {
    const userCookie = Cookies.get('user');
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error parsing user cookie:', error);
        Cookies.remove('user');
      }
    }
  };

  const loadPosts = async () => {
    try {
      const response = await fetch('/api/posts');
      if (response.ok) {
        const postsData = await response.json();
        setPosts(postsData);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const handleLocationFound = (lat: number, lng: number) => {
    setUserLocation([lat, lng]);
  };

  const handleLogin = async (formData: FormData) => {
    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      if (response.ok) {
        const user = await response.json();
        setCurrentUser(user);
        Cookies.set('user', JSON.stringify(user), { expires: 7 });
        setShowLoginDialog(false);
      } else {
        alert('Credenciales incorrectas');
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert('Error al iniciar sesión');
    }
  };

  const handleRegister = async (formData: FormData) => {
    const username = formData.get('username') as string;
    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, phone, password }),
      });

      if (response.ok) {
        const user = await response.json();
        setCurrentUser(user);
        Cookies.set('user', JSON.stringify(user), { expires: 7 });
        setShowLoginDialog(false);
      } else {
        const error = await response.text();
        alert(error);
      }
    } catch (error) {
      console.error('Error during registration:', error);
      alert('Error al registrarse');
    }
  };

  const handleCreatePost = async () => {
    if (!currentUser) return;

    const post: Omit<Post, 'id' | 'timestamp'> = {
      title: newPost.title,
      description: newPost.description,
      price: parseFloat(newPost.price),
      lat: userLocation[0],
      lng: userLocation[1],
      username: currentUser.username,
      phone: currentUser.phone,
    };

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      });

      if (response.ok) {
        const createdPost = await response.json();
        setPosts([...posts, createdPost]);
        setNewPost({ title: '', description: '', price: '' });
        setShowPostDialog(false);
      } else {
        alert('Error al crear la publicación');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error al crear la publicación');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    Cookies.remove('user');
  };

  if (!isClient) {
    return <div className="flex items-center justify-center h-screen bg-gray-100">Cargando...</div>;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Map */}
      <MapContainer
        center={userLocation}
        zoom={15}
        className="w-full h-full"
        style={{ zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={userLocation} onLocationFound={handleLocationFound} />
        
        {/* User location marker */}
        <Marker position={userLocation}>
          <Popup>
            <div className="text-sm">
              <strong>Tu ubicación</strong>
              <br />
              Lat: {userLocation[0].toFixed(6)}
              <br />
              Lng: {userLocation[1].toFixed(6)}
            </div>
          </Popup>
        </Marker>

        {/* Posts markers */}
        {posts.map((post) => (
          <Marker key={post.id} position={[post.lat, post.lng]}>
            <Popup>
              <Card className="w-64">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-gray-600">{post.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      ${post.price}
                    </Badge>
                    <span className="text-xs text-gray-500">{post.username}</span>
                  </div>
                </CardContent>
              </Card>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Top Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start">
        {/* Logo/Title */}
        <div className="bg-white rounded-lg shadow-lg p-3">
          <h1 className="text-lg font-bold text-gray-800">MapaCuba</h1>
        </div>

        {/* User Controls */}
        <div className="flex gap-2">
          {currentUser ? (
            <>
              <div className="bg-white rounded-lg shadow-lg p-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">{currentUser.username}</span>
              </div>
              <Button onClick={() => setShowPostDialog(true)} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-1" />
                Publicar
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <User className="w-4 h-4 mr-1" />
                  Iniciar Sesión
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Autenticación</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                    <TabsTrigger value="register">Registrarse</TabsTrigger>
                  </TabsList>
                  <TabsContent value="login">
                    <form action={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="+53 12345678"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Iniciar Sesión
                      </Button>
                    </form>
                  </TabsContent>
                  <TabsContent value="register">
                    <form action={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Nombre de Usuario</Label>
                        <Input
                          id="username"
                          name="username"
                          type="text"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-phone">Teléfono (Cuba)</Label>
                        <Input
                          id="reg-phone"
                          name="phone"
                          type="tel"
                          placeholder="+53 12345678"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-password">Contraseña</Label>
                        <Input
                          id="reg-password"
                          name="password"
                          type="password"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Registrarse
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Create Post Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crear Nueva Publicación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                placeholder="Título del anuncio"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={newPost.description}
                onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
                placeholder="Describe tu producto o servicio"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Precio</Label>
              <Input
                id="price"
                type="number"
                value={newPost.price}
                onChange={(e) => setNewPost({ ...newPost, price: e.target.value })}
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreatePost} className="flex-1">
                Publicar
              </Button>
              <Button variant="outline" onClick={() => setShowPostDialog(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Location Status */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-white rounded-lg shadow-lg p-3 flex items-center gap-2">
          <Navigation className="w-4 h-4 text-green-600" />
          <span className="text-sm">Ubicación activa</span>
        </div>
      </div>

      {/* Posts Counter */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="bg-white rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">{posts.length} publicaciones</span>
          </div>
        </div>
      </div>
    </div>
  );
}