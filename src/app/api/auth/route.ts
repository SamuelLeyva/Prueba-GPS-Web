import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Registro de usuario
export async function POST(request: NextRequest) {
  try {
    const { username, email, phone, password, action } = await request.json();

    if (action === 'register') {
      // Validar campos
      if (!username || !password || !phone) {
        return NextResponse.json(
          { error: 'Todos los campos son requeridos. Debes proporcionar username, password y phone.' },
          { status: 400 }
        );
      }

      // Verificar si el usuario ya existe
      const existingUser = await db.user.findFirst({
        where: {
          OR: [
            { username: username },
            { phone: phone }
          ]
        }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'El usuario o teléfono ya está registrado.' },
          { status: 400 }
        );
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const user = await db.user.create({
        data: {
          username,
          phone,
          password: hashedPassword
        }
      });

      return NextResponse.json(
        { message: 'Usuario registrado exitosamente', userId: user.id },
        { status: 201 }
      );
    }

    if (action === 'login') {
      // Validar campos
      if (!phone || !password) {
        return NextResponse.json(
          { error: 'Teléfono y contraseña son requeridos.' },
          { status: 400 }
        );
      }

      // Buscar usuario
      const user = await db.user.findFirst({
        where: {
          phone: phone
        }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Credenciales incorrectas.' },
          { status: 401 }
        );
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Credenciales incorrectas.' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { 
          message: 'Inicio de sesión exitoso',
          user: {
            id: user.id,
            username: user.username,
            phone: user.phone
          }
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Acción no válida.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error en autenticación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}