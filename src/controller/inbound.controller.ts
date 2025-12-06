import { Request, Response } from 'express';
import { parseProposalFromEmail } from '../services/gemini';
import { prisma } from '../constants';

export const handleInboundEmail = async (req: Request, res: Response) => {
  try {
    const { text, rfpId, vendorId } = req.body;

    const parsedData = await parseProposalFromEmail(text);

    const proposal = await prisma.proposal.create({
      data: {
        rfpId,
        vendorId,
        rawEmail: text,
        parsedData,
        totalPrice: parsedData.totalPrice || null
      }
    });

    return res.status(201).json(proposal);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process email' });
  }
};
