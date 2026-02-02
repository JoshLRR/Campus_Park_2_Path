import http from 'node:http';
import {URL} from 'node:url';
import {routes} from './data/routes';

export function createServer(): http.Server {
  return http.createServer((req, res) => {
    if (!req.url || !req.method) {
      res.statusCode = 400;
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);

    const route = routes.find(
      entry => entry.method === req.method && entry.path === url.pathname,
    );
    if (route) {
      res.statusCode = route.status;
      res.end();
      return;
    }

    res.statusCode = 404;
    res.end();
  });
}
