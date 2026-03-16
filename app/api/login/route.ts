import { NextResponse } from 'next/server';

const MOCK_USERS: Record<string, { password: string; role: string; id: number }> = {
  "gn_user": { password: "password123", role: "GN", id: 2 },
  "family_user": { password: "password123", role: "FAMILY", id: 1 },
  "doctor_user": { password: "password123", role: "DOCTOR", id: 3 },
  "registrar_user": { password: "password123", role: "REGISTRAR", id: 4 },
  "police_user": { password: "password123", role: "POLICE", id: 5 },
};

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required" },
        { status: 400 }
      );
    }

    const user = MOCK_USERS[username.toLowerCase()];

    if (user && user.password === password) {
      return NextResponse.json(
        { message: "Login successful", role: user.role, userId: user.id },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
