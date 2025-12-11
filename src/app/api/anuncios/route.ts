import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const { db } = await import('@/lib/db');
    
    const anuncios = await db.anuncio.findMany({
      include: {
        user: {
          select: {
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(anuncios);
  } catch (error) {
    console.error('Error al obtener anuncios:', error);
    return NextResponse.json(
      { error: 'Error al obtener anuncios' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await import('@/lib/db');
    const body = await request.json();

    const { titulo, descripcion, precio, latitud, longitud, userId } = body;

    if (!titulo || !latitud || !longitud || !userId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const anuncio = await db.anuncio.create({
      data: {
        titulo,
        descripcion: descripcion || null,
        precio: precio || null,
        latitud: parseFloat(latitud),
        longitud: parseFloat(longitud),
        userId
      },
      include: {
        user: {
          select: {
            username: true
          }
        }
      }
    });

    return NextResponse.json(anuncio, { status: 201 });
  } catch (error) {
    console.error('Error al crear anuncio:', error);
    return NextResponse.json(
      { error: 'Error al crear anuncio' },
      { status: 500 }
    );
  }
}