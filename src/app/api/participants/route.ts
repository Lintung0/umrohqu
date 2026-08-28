import { NextRequest } from "next/server"

const UNAVAILABLE = { error: "Modul data peserta tidak tersedia pada skema baru" }

export async function GET() {
  return Response.json(UNAVAILABLE, { status: 404 })
}

export async function POST() {
  return Response.json(UNAVAILABLE, { status: 404 })
}

export async function PUT() {
  return Response.json(UNAVAILABLE, { status: 404 })
}

export async function DELETE() {
  return Response.json(UNAVAILABLE, { status: 404 })
}
