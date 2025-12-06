import { Router } from 'express';
import { createRfp, generateRfp, getAllRfps, getRfpById, getRfpProposals, sendRfpToVendors, confirmProposal, rejectProposal, chatWithAI, generateRfpFromChatController } from '../controller/rfp.controller';

const router = Router()

router.post('/rfps/generate', generateRfp);
router.post('/rfps', createRfp);
router.get('/rfps', getAllRfps);
router.get('/rfps/:id', getRfpById);
router.post('/rfps/:id/send', sendRfpToVendors);
router.get('/rfps/:id/proposals', getRfpProposals);
router.post('/rfps/:id/proposals/:proposalId/confirm', confirmProposal);
router.post('/rfps/:id/proposals/:proposalId/reject', rejectProposal);
router.post('/chat/message', chatWithAI);
router.post('/chat/generate', generateRfpFromChatController);

export default router
