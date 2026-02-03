import type http from 'node:http';
import {rooms} from '../data/rooms';

/**
 * Returns a list of route step strings for the current request.
 *
 * @param _req - Incoming request (unused for now).
 * @param res - Response used to send JSON.
 */
export async function getRoute(
  _req: http.IncomingMessage,
  res: http.ServerResponse,
) {
  const routeSteps: string[] = [
    'Start at the main entrance',
    'Head north along the courtyard',
    'Turn right at the library',
    'Arrive at your destination',
    'Simply, just find the room on pure vibes ya dunce',
  ];
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(routeSteps));
}

/**
 * Returns a JSON payload containing the available rooms.
 *
 * @param _req - Incoming request (unused for now).
 * @param res - Response used to send JSON.
 */
export async function getRooms(
  _req: http.IncomingMessage,
  res: http.ServerResponse,
) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({rooms}));
}
