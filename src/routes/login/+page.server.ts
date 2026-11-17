import { authenticate } from '#lib/server/auth.js';
export const actions = { default: (event) => authenticate(event, '/login') } satisfies import('./$types').Actions;
