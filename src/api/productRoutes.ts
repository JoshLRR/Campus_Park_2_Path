import type http from 'node:http';
import {getRooms, getRoute} from '../handlers/routeHandlers';

/**
 * Supported HTTP methods for API routes.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Describes a single API route and its handler.
 */
export type ApiRoute = {
  method: HttpMethod;
  path: string;
  handler: (
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ) => void | Promise<void>;
};

/**
 * Registered API routes for the HTTP server.
 */
export const routes: ApiRoute[] = [
  {
    method: 'GET',
    path: '/route',
    handler: getRoute,
  },
  {
    method: 'GET',
    path: '/rooms',
    handler: getRooms,
  },
];
