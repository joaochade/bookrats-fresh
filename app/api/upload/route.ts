import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // Handle JSON (base64) - for simple MVP
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { image } = body;

      if (!image) {
        return NextResponse.json(
          { error: 'No image provided' },
          { status: 400 }
        );
      }

      return NextResponse.json({ imageUrl: image }, { status: 201 });
    }

    // Handle FormData (file upload) - for frontend
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json(
          { error: 'No file uploaded' },
          { status: 400 }
        );
      }

      // Convert to base64 for MVP (no file system needed)
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString('base64');
      const mimeType = file.type || 'image/jpeg';
      const imageUrl = `data:${mimeType};base64,${base64}`;

      return NextResponse.json({ imageUrl }, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Invalid content type. Use application/json or multipart/form-data' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}