export const rateLimiter = {
  limit: async (ip: string) => {
    // Simple mock rate limiter
    return {
      success: true,
      retryAfter: 0,
    };
  },
};
