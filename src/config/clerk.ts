import { clerkClient, createClerkClient } from '@clerk/express';
import config from './env';

export const clerk = config.clerk.secretKey
  ? createClerkClient({ secretKey: config.clerk.secretKey, publishableKey: config.clerk.publishableKey })
  : clerkClient;

export default clerk;
