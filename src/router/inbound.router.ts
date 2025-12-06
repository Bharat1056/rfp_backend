import {Router} from "express"
import { handleSendGridInbound } from '../services/sendgrid-inbound';
import { parseInboundEmail } from '../constants';

const router = Router()

router.post(
  '/sendgrid',
  parseInboundEmail,
  handleSendGridInbound
);

export default router
