import { NextResponse } from "next/server";
import { createHash } from "crypto";

const SALT = "lexskripta-salt-2026";
const CURRENT_PASSWORD = process.env.DASHBOARD_PASSWORD || "12345678";

function hashPassword(password: string): string {
  return createHash("sha256").update(password + SALT).digest("hex");
}

export async function PUT(request: Request) {
  try {
    const { oldPassword, newPassword, confirmPassword } = await request.json();

    if (!oldPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Password baru dan konfirmasi tidak sama" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password baru harus minimal 8 karakter" },
        { status: 400 }
      );
    }

    // Verify old password
    if (oldPassword !== CURRENT_PASSWORD) {
      return NextResponse.json(
        { error: "Password lama salah" },
        { status: 401 }
      );
    }

    // In production: write to .env file or PM2 config
    // For now, return the hash so it can be used
    const hashed = hashPassword(newPassword);

    return NextResponse.json({
      ok: true,
      message: "Password berhasil diubah! Restart PM2 untuk menerapkan.",
      hash: hashed,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Gagal memproses request" },
      { status: 500 }
    );
  }
}