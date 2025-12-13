import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const USERS_DIR = join(process.cwd(), 'data', 'users');

// Asegurarse de que el directorio de usuarios exista
async function ensureUsersDir() {
  if (!existsSync(USERS_DIR)) {
    await mkdir(USERS_DIR, { recursive: true });
  }
}

// Encriptar contraseña
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Validar número de teléfono cubano
function validateCubanPhone(phone: string): boolean {
  // Formato: +53 5XXXXXXX o +53 7XXXXXXX
  const cubanPhoneRegex = /^\+53\s?[57]\d{7}$/;
  return cubanPhoneRegex.test(phone.replace(/\s/g, ''));
}

export async function POST(request: NextRequest) {
  try {
    const { username, phone, password } = await request.json();

    // Validar campos
    if (!username || !phone || !password) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    // Validar teléfono cubano
    if (!validateCubanPhone(phone)) {
      return NextResponse.json(
        { error: 'El número de teléfono debe ser de Cuba (formato: +53 5XXXXXXX o +53 7XXXXXXX)' },
        { status: 400 }
      );
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    await ensureUsersDir();

    // Nombre del archivo: teléfono del usuario
    const filename = phone.replace(/\s/g, '') + '.json';
    const filepath = join(USERS_DIR, filename);

    // Verificar si el usuario ya existe
    if (existsSync(filepath)) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este número de teléfono' },
        { status: 409 }
      );
    }

    // Crear objeto de usuario
    const user = {
      username,
      phone,
      password: hashPassword(password),
      createdAt: new Date().toISOString(),
    };

    // Guardar usuario en archivo JSON
    await writeFile(filepath, JSON.stringify(user, null, 2));

    // Devolver usuario sin contraseña
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}