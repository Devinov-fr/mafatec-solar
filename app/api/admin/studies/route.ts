import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Study from '@/models/Study';
import User from '@/models/User';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    await dbConnect();

    let filter = {};
    if (query) {
      filter = {
        $or: [
          { userEmail: { $regex: query, $options: 'i' } },
          { adresse: { $regex: query, $options: 'i' } },
        ],
      };
    }

    const studies = await Study.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, studies });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
