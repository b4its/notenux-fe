import { authenticate } from '#lib/server/auth.js';
export const actions = { default: (event) => authenticate(event, '/register') } satisfies import('./$types').Actions;
