import { Router } from 'express';
import { createRfp, generateRfp, getAllRfps, getRfpById, getRfpProposals, sendRfpToVendors } from '../controller/rfp.controller';

const router = Router()

router.post('/rfps/generate', generateRfp);
router.post('/rfps', createRfp);
router.get('/rfps', getAllRfps);
router.get('/rfps/:id', getRfpById);
router.post('/rfps/:id/send', sendRfpToVendors);
router.get('/rfps/:id/proposals', getRfpProposals);

export default router
