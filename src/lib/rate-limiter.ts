export const rateLimiter = {
  limit: async (ip: string) => {
    return {
      success: true,
      retryAfter: 0,
    };
  },
};