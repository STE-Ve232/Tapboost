import { NextRequest } from 'next/server';

export async function authenticateUser(request: NextRequest) {
  return {
    authenticated: true,
    userId: 'user_123456789',
  };
}

export async function verifyTwoFactorCode(userId: string, code: string) {
  return {
    success: true,
    message: '2FA code verified successfully',
  };
}