import { Router } from 'express';
import * as controllers from './controllers';

export const router = Router();

// RFP Routes
router.post('/rfps/generate', controllers.generateRfp);
router.post('/rfps', controllers.createRfp);
router.get('/rfps', controllers.getAllRfps);
router.get('/rfps/:id', controllers.getRfpById);
router.post('/rfps/:id/send', controllers.sendRfpToVendors);
router.get('/rfps/:id/proposals', controllers.getRfpProposals);

// Vendor Routes
router.post('/vendors', controllers.createVendor);
router.get('/vendors', controllers.getAllVendors);

// Email Stub
router.post('/emails/inbound', controllers.handleInboundEmail);
