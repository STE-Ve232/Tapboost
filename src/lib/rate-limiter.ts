
export const rateLimiter = {
  limit: async (ip: string) => {
    // Basic mock rate limiter
    return {
      success: true,
      retryAfter: 0,
    };
  },
};
