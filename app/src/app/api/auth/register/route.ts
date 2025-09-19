import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/auth-db";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número" },
        { status: 400 }
      );
    }

    const user = await registerUser(email, password, name);
    
    return NextResponse.json(
      { message: "Usuario registrado exitosamente", user: { id: user.id, email: user.email, name: user.name } },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno del servidor" },
      { status: 500 }
    );
  }
}