import Hapi from '@hapi/hapi';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { presignUpload } from './lib/s3.js';

dotenv.config();

const server = Hapi.server({
  port: process.env.PORT || 8080,
  host: '0.0.0.0',
  routes: {
    cors: {
      origin: ['*'],
      additionalHeaders: ['content-type', 'authorization']
    }
  }
});

server.route({
  method: 'GET',
  path: '/healthz',
  handler: () => ({ ok: true })
});

server.route({
  method: 'POST',
  path: '/uploads/presign',
  options: {
    cors: true
  },
  handler: async (request, h) => {
    try {
      const { filename, contentType } = request.payload || {};
      if (!contentType || typeof contentType !== 'string') {
        return h.response({ error: 'contentType is required' }).code(400);
      }

      // Validate allowed MIME types if provided
      const rawAllowed = (process.env.ALLOWED_MIME || '').trim();
      if (rawAllowed) {
        const allowed = rawAllowed.split(',').map(s => s.trim()).filter(Boolean);
        if (!allowed.includes(contentType)) {
          return h.response({ error: `contentType not allowed. Allowed: ${allowed.join(', ')}` }).code(400);
        }
      }

      const bucket = process.env.S3_BUCKET;
      const region = process.env.S3_REGION || 'us-east-1';
      if (!bucket) {
        return h.response({ error: 'S3_BUCKET env var is required' }).code(500);
      }

      const maxMB = Number(process.env.UPLOAD_MAX_MB || '25');
      const maxBytes = Math.max(1, Math.floor(maxMB * 1024 * 1024));
      const expiresSec = Number(process.env.PRESIGN_EXPIRES_SEC || '600');

      const keyPrefix = process.env.UPLOAD_KEY_PREFIX || 'uploads';
      const safeName = (filename || 'file').replace(/[^A-Za-z0-9._-]/g, '_');
      const datePrefix = new Date().toISOString().slice(0, 10);
      const key = `${keyPrefix}/${datePrefix}/${randomUUID()}-${safeName}`;

      const { url, fields } = await presignUpload({
        bucket,
        key,
        contentType,
        maxBytes,
        expiresSec
      });

      return h
        .response({
          url,
          fields,
          key,
          publicUrl: `https://${bucket}.s3.${region}.amazonaws.com/${key}`,
          expiresInSeconds: expiresSec
        })
        .code(201);
    } catch (err) {
      console.error('presign error:', err);
      return h.response({ error: 'internal_error' }).code(500);
    }
  }
});

const init = async () => {
  await server.start();
  console.log(`Server listening on ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

init();
