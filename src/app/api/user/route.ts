
import { NextResponse } from 'next/server';

interface UserData {
  username: string;
  points: number;
  avatarUrl: string;
}

export async function GET(request: Request) {
  try {
    // In a real application, you would fetch this data from a database or authentication service.
    // For now, we'll return mock data that aligns with what UserProfile.tsx expects.
    const mockUserData: UserData = {
      username: 'TapUser123',
      points: 1500,
      avatarUrl: 'https://placehold.co/150x150.png', // Using placehold.co as per guidelines
    };

    return NextResponse.json(mockUserData);

  } catch (error) {
    // Log the error on the server for debugging purposes
    console.error('Error in /api/user GET handler:', error);

    // Return a structured error response to the client
    // This ensures the client gets a JSON response even if an unexpected server error occurs.
    return NextResponse.json(
      { 
        message: 'An unexpected error occurred on the server while fetching user data.', 
        errorDetails: (error instanceof Error) ? error.message : 'Unknown server error' 
      },
      { status: 500 }
    );
  }
}
