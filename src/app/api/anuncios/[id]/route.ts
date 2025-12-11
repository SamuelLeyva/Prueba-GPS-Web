import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await import('@/lib/db');
    
    const anuncio = await db.anuncio.findUnique({
      where: {
        id: params.id
      }
    });

    if (!anuncio) {
      return NextResponse.json(
        { error: 'Anuncio no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(anuncio);
  } catch (error) {
    console.error('Error al obtener anuncio:', error);
    return NextResponse.json(
      { error: 'Error al obtener anuncio' },
      { status: 500 }
    );
  }
}