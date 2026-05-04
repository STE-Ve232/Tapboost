import { NextRequest } from 'next/server';

export async function authenticateUser(request: NextRequest) {
  // Mock authentication for the prototype
  return {
    authenticated: true,
    userId: 'user_dev_123',
  };
}

export async function verifyTwoFactorCode(userId: string, code: string) {
  return {
    success: true,
    message: '2FA code verified successfully',
  };
}
