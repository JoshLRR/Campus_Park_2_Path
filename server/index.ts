import express from 'express';
import cors from 'cors';
import {pathGrabber} from './path';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.use('/api', pathGrabber);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
