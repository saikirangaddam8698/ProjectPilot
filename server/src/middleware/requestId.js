/**
 * Task 16 — Request ID Middleware
 * Generates or validates a unique correlation ID for incoming HTTP requests.
 * Attaches requestId to req.requestId and X-Request-Id HTTP response header.
 */
import crypto from 'node:crypto';

export function requestId(req, res, next) {
  const incomingId = req.headers['x-request-id'];

  let correlationId;
  if (typeof incomingId === 'string' && /^[a-zA-Z0-9_-]{8,64}$/.test(incomingId.trim())) {
    correlationId = incomingId.trim();
  } else {
    const randomBytes = crypto.randomBytes(6).toString('hex');
    correlationId = `ai_${randomBytes}`;
  }

  req.requestId = correlationId;
  res.setHeader('X-Request-Id', correlationId);

  next();
}
