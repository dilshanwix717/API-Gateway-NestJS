export const mockRedisService = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
  del: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
  isHealthy: jest.fn<Promise<boolean>, []>().mockResolvedValue(true),
  onModuleInit: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
  onModuleDestroy: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
};

export function resetRedisMock(): void {
  Object.values(mockRedisService).forEach((fn) => fn.mockReset());
  mockRedisService.get.mockResolvedValue(null);
  mockRedisService.isHealthy.mockResolvedValue(true);
}
