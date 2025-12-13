import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const USERS_DIR = join(process.cwd(), 'data', 'users');

// Encriptar contraseña
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { phone, password } = await request.json();

    // Validar campos
    if (!phone || !password) {
      return NextResponse.json(
        { error: 'El teléfono y la contraseña son obligatorios' },
        { status: 400 }
      );
    }

    // Nombre del archivo: teléfono del usuario
    const filename = phone.replace(/\s/g, '') + '.json';
    const filepath = join(USERS_DIR, filename);

    // Verificar si el usuario existe
    if (!existsSync(filepath)) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Leer archivo de usuario
    const userData = await readFile(filepath, 'utf-8');
    const user = JSON.parse(userData);

    // Verificar contraseña
    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    // Devolver usuario sin contraseña
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);

  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}