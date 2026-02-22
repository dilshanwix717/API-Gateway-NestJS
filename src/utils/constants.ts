export const TRACE_ID_HEADER = 'x-request-id';

export const EXCHANGES = {
  EVENTS: 'events',
} as const;

export const ROUTING_KEYS = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  VIDEO_UPLOADED: 'video.uploaded',
} as const;

export const QUEUES = {
  GATEWAY_EVENTS: 'gateway.events',
  GATEWAY_DLQ: 'gateway.events.dlq',
} as const;

export const CACHE_KEYS = {
  USER_PROFILE: (id: string) => `user:profile:${id}`,
  VIDEO_META: (id: string) => `video:meta:${id}`,
} as const;

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;
