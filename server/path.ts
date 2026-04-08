import {Router} from 'express';
import {createPathAPI} from '../src/logic/PathingComponent/api/CreatePathingAPI';

const api = createPathAPI();

export const pathGrabber = Router();

const STATUS_CODES: Record<string, number> = {
  success: 200,
  not_found: 404,
  validation_error: 400,
};

pathGrabber.post('/path', async (req, res) => {
  const response = await api.path(req.body);
  const statusCode = STATUS_CODES[response.status] ?? 500;
  res.status(statusCode).json(response);
});
