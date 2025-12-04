import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import vendorRouter from "./router/vendor.router"
import rfpRouter from "./router/rfp.router"
import inboundRouter from "./router/inbound.router"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: [process.env.FRONTEND_URL_1 as string , process.env.FRONTEND_URL_2 as string],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(express.json());

app.use('/api/v1/vendor', vendorRouter);
app.use('/api/v1/rfp', rfpRouter);
app.use('/api/v1/inbound', inboundRouter);

app.get('/health', (req, res) => {
  res.send('OK');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
