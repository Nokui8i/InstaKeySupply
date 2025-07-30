import { NextRequest, NextResponse } from 'next/server';

interface Banner {
  id: number;
  imageUrl: string;
  alt: string;
}

let banners: Banner[] = [
  // Example: { id: 1, imageUrl: '/banner1.jpg', alt: 'Banner 1' }
];

export async function GET() {
  return NextResponse.json(banners);
}

export async function POST(req: NextRequest) {
  const { imageUrl, alt } = await req.json();
  const id = Date.now();
  banners.push({ id, imageUrl, alt });
  return NextResponse.json({ success: true, id });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  banners = banners.filter(b => b.id !== id);
  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest) {
  const { id, imageUrl, alt } = await req.json();
  banners = banners.map(b => b.id === id ? { ...b, imageUrl, alt } : b);
  return NextResponse.json({ success: true });
} 