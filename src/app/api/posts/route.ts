import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const POSTS_DIR = join(process.cwd(), 'data', 'posts');
const POSTS_FILE = join(POSTS_DIR, 'posts.json');

// Asegurarse de que el directorio de posts exista
async function ensurePostsDir() {
  if (!existsSync(POSTS_DIR)) {
    await mkdir(POSTS_DIR, { recursive: true });
  }
}

// Leer posts existentes
async function readPosts(): Promise<any[]> {
  try {
    if (!existsSync(POSTS_FILE)) {
      return [];
    }
    const postsData = await readFile(POSTS_FILE, 'utf-8');
    return JSON.parse(postsData);
  } catch (error) {
    console.error('Error reading posts:', error);
    return [];
  }
}

// Guardar posts
async function savePosts(posts: any[]): Promise<void> {
  await writeFile(POSTS_FILE, JSON.stringify(posts, null, 2));
}

// GET: Obtener todos los posts
export async function GET() {
  try {
    await ensurePostsDir();
    const posts = await readPosts();
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error getting posts:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST: Crear nuevo post
export async function POST(request: NextRequest) {
  try {
    const { title, description, price, lat, lng, username, phone } = await request.json();

    // Validar campos
    if (!title || !description || !price || !lat || !lng || !username || !phone) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    // Validar precio
    if (isNaN(price) || price <= 0) {
      return NextResponse.json(
        { error: 'El precio debe ser un número positivo' },
        { status: 400 }
      );
    }

    await ensurePostsDir();

    // Leer posts existentes
    const posts = await readPosts();

    // Crear nuevo post
    const newPost = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title,
      description,
      price: parseFloat(price),
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      username,
      phone,
      timestamp: Date.now(),
    };

    // Agregar post a la lista
    posts.push(newPost);

    // Guardar posts
    await savePosts(posts);

    return NextResponse.json(newPost, { status: 201 });

  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}