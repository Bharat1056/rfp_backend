import {Router} from "express"
import { verifySendGridWebhook } from '../middleware/sendgrid.middleware';
import { handleSendGridInbound } from '../services/sendgrid-inbound';
import { handleInboundEmail } from '../controller/inbound.controller';
import { parseInboundEmail } from '../constants';

const router = Router()

router.post(
  '/webhooks/sendgrid/inbound',
  verifySendGridWebhook,
  parseInboundEmail,
  handleSendGridInbound
);

// Legacy inbound email endpoint (kept for backward compatibility)
router.post('/emails/inbound', handleInboundEmail);


export default router
