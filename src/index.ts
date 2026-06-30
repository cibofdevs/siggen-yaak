import type { PluginDefinition } from '@yaakapp/api';
import { createSign, randomUUID } from 'node:crypto';

function buildPrivateKeyPem(keyInput: string): string {
  const stripped = keyInput
    .replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----/g, '')
    .replace(/-----END (?:RSA )?PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  return `-----BEGIN PRIVATE KEY-----\n${stripped}\n-----END PRIVATE KEY-----`;
}

function generateSignature(body: string, path: string, privateKeyBase64: string): string {
  const message = `${body}&${path}`;
  const pem = buildPrivateKeyPem(privateKeyBase64);
  const sign = createSign('RSA-SHA256');
  sign.update(message, 'utf8');
  return sign.sign(pem, 'base64');
}

function extractBodyText(body: Record<string, any>): string | null {
  // Yaak stores text/json bodies as { text: "..." }
  if (typeof body.text === 'string') return body.text || null;
  return null;
}

const TS_CACHE_KEY = 'payok_ts';
const UUID_CACHE_KEY = 'payok_uuid';
const TS_CACHE_TTL = 10_000;

export const plugin: PluginDefinition = {
  templateFunctions: [
    {
      name: 'payok.signature',
      description: 'Generate PAYOK RSA-SHA256 digital signature. Reads the request body automatically from context.',
      previewType: 'none',
      args: [
        {
          type: 'text',
          name: 'path',
          label: 'Endpoint Path',
          placeholder: '/api/v1/payment',
        },
        {
          type: 'text',
          name: 'private_key',
          label: 'Private Key (Base64, without PEM headers)',
          placeholder: 'MIIEvQIBADANBgkqhkiG9w0BAQEFAASC...',
          password: true,
          multiLine: true,
        },
      ],
      async onRender(ctx, args) {
        const path = String(args.values.path ?? '').trim();
        const privateKey = String(args.values.private_key ?? '').trim();

        if (!path || !privateKey) return null;

        const requestId = await ctx.window.requestId();
        if (!requestId) return null;

        const rawRequest = await ctx.httpRequest.getById({ id: requestId });
        if (!rawRequest) return null;

        // Read raw body text (template tags still unresolved) to avoid render recursion
        const rawBodyText = extractBodyText(rawRequest.body);
        if (!rawBodyText) return null;

        // Expire caches so each send gets a fresh timestamp and UUID.
        // payok.timestamp/payok.uuid will regenerate values on the next call and
        // cache them, so the subsequent actual body render reuses the same values.
        await ctx.store.set(TS_CACHE_KEY, { ts: '', at: 0 });
        await ctx.store.set(UUID_CACHE_KEY, { id: '', at: 0 });

        // Render only the body string — ctx.templates.render resolves {{ }} tags
        // without triggering a full request render (no infinite recursion)
        const renderedBody = await ctx.templates.render({
          data: rawBodyText,
          purpose: args.purpose,
        });

        if (typeof renderedBody !== 'string' || !renderedBody) return null;

        return generateSignature(renderedBody, path, privateKey);
      },
    },
    {
      name: 'payok.timestamp',
      description: 'Generate current ISO8601 timestamp for PAYOK request headers',
      previewType: 'live',
      args: [],
      // Cache timestamp for 10 seconds so that payok.signature and the request body
      // always use the same value within a single request cycle.
      async onRender(ctx) {
        const now = Date.now();
        const cached = await ctx.store.get<{ ts: string; at: number }>(TS_CACHE_KEY);
        if (cached && (now - cached.at) < TS_CACHE_TTL) {
          return cached.ts;
        }
        const ts = new Date().toISOString();
        await ctx.store.set(TS_CACHE_KEY, { ts, at: now });
        return ts;
      },
    },
    {
      name: 'payok.uuid',
      description: 'Generate a UUID that stays consistent within a single request cycle, so payok.signature and the request body use the same value.',
      previewType: 'live',
      args: [],
      // Caches the UUID for 10 seconds — the same window used by payok.timestamp.
      // Both the signature render pass and the body render pass happen within
      // milliseconds of each other, so they receive the same UUID. A new UUID
      // is generated on the next send after the TTL expires.
      async onRender(ctx) {
        const now = Date.now();
        const cached = await ctx.store.get<{ id: string; at: number }>(UUID_CACHE_KEY);
        if (cached && (now - cached.at) < TS_CACHE_TTL) {
          return cached.id;
        }
        const id = randomUUID();
        await ctx.store.set(UUID_CACHE_KEY, { id, at: now });
        return id;
      },
    },
  ],
};
