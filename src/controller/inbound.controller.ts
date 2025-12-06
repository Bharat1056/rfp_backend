import { Request, Response } from 'express';
import { parseProposalFromEmail } from '../services/gemini';
import { prisma } from '../constants';

export const handleInboundEmail = async (req: Request, res: Response) => {
  try {
    const { from, subject, text, rfpId, vendorId } = req.body;
    console.log("rfpId: ", rfpId)
    console.log("vendorId: ", vendorId)

    // Parse the email content using Gemini
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

    console.log("proposal accepted: ", proposal)

    return res.status(201).json(proposal);
  } catch (error) {
    console.error('Error processing inbound email:', error);
    return res.status(500).json({ error: 'Failed to process email' });
  }
};
