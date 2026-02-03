import {afterAll, beforeAll, expect, test} from 'vitest';
import {createServer} from '../server';

let baseUrl = '';
let server: ReturnType<typeof createServer> | undefined;

beforeAll(async () => {
  server = createServer();
  await new Promise<void>(resolve => {
    server?.listen(0, () => {
      const address = server?.address();
      if (address && typeof address !== 'string') {
        baseUrl = `http://127.0.0.1:${address.port}`;
      }
      resolve();
    });
  });
});

afterAll(async () => {
  if (!server) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server?.close(err => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
});

test('GET /route returns a JSON array of strings', async () => {
  const response = await fetch(`${baseUrl}/route`);
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
  expect(body.every((item: unknown) => typeof item === 'string')).toBe(true);
});

test('GET /rooms returns a rooms payload', async () => {
  const response = await fetch(`${baseUrl}/rooms`);
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body).toHaveProperty('rooms');
  expect(Array.isArray(body.rooms)).toBe(true);
});

test('unknown route returns 404', async () => {
  const response = await fetch(`${baseUrl}/not-found`);
  expect(response.status).toBe(404);
});
