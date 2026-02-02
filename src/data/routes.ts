export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiRoute = {
  method: HttpMethod;
  path: string;
  status: number;
};

export const routes: ApiRoute[] = [
  {
    method: 'GET',
    path: '/route',
    status: 204,
  },
  {
    method: 'GET',
    path: '/rooms',
    status: 204,
  },
];
