export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { authenticateUser } from '@/lib/auth-utils';
import { updateUserCurrency } from '@/lib/db-utils';

export async function POST(request: NextRequest) {
  const authResult = await authenticateUser(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  try {
    const { currency } = await request.json();
    if (!currency) return NextResponse.json({ message: 'Currency required' }, { status: 400 });
    
    await updateUserCurrency(authResult.userId, currency);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update currency error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
