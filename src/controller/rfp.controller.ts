import { Request, Response } from 'express';
import { generateRfpFromDescription, chatWithProcurementAI, generateRfpFromChat } from '../services/gemini';
import { sendRfpEmail } from '../services/email-templates';
import { prisma } from '../constants';
import { RfpStatus } from '@prisma/client';

export const generateRfp = async (req: Request, res: Response) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }
    const structuredRfp = await generateRfpFromDescription(description);
    return res.json(structuredRfp);
  } catch (error) {
    console.error('Error generating RFP:', error);
    return res.status(500).json({ error: 'Failed to generate RFP' });
  }
};

export const chatWithAI = async (req: Request, res: Response) => {
  try {
    const { history, message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    // history is array of { role: 'user' | 'model', content: string }
    const response = await chatWithProcurementAI(history || [], message);
    return res.json(response);
  } catch (error) {
    console.error('Error in chat:', error);
    return res.status(500).json({ error: 'Failed to process chat message' });
  }
};

export const generateRfpFromChatController = async (req: Request, res: Response) => {
  try {
    const { history } = req.body;
    if (!history || !Array.isArray(history)) {
      return res.status(400).json({ error: 'Chat history is required' });
    }

    const structuredRfp = await generateRfpFromChat(history);
    return res.json(structuredRfp);
  } catch (error) {
    console.error('Error generating RFP from chat:', error);
    return res.status(500).json({ error: 'Failed to generate RFP from chat' });
  }
};

export const createRfp = async (req: Request, res: Response) => {
  try {
    const { title, description, items, budget, deliveryDays, paymentTerms, warranty } = req.body;
    const rfp = await prisma.rfp.create({
      data: {
        title,
        description,
        items,
        budget: budget ? parseFloat(budget) : null,
        deliveryDays: deliveryDays ? parseInt(deliveryDays) : null,
        paymentTerms,
        warranty
      }
    });
    return res.status(201).json(rfp);
  } catch (error) {
    console.error('Error creating RFP:', error);
    return res.status(500).json({ error: 'Failed to create RFP' });
  }
};

export const getAllRfps = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const where = status ? { status: status as RfpStatus } : {}; // if no status then show all

    const rfps = await prisma.rfp.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        proposals: {
            select: { id: true }
        }
      }
    });
    return res.json(rfps);
  } catch (error) {
    console.log("err: ", error)
    return res.status(500).json({ error: 'Failed to fetch RFPs' });
  }
};

export const getRfpById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rfp = await prisma.rfp.findUnique({
      where: { id },
      include: { proposals: { include: { vendor: true } } }
    });
    if (!rfp) return res.status(404).json({ error: 'RFP not found' });
    return res.json(rfp);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch RFP' });
  }
};

export const sendRfpToVendors = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { vendorIds } = req.body;

    if (!vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
      return res.status(400).json({ error: 'No vendors selected' });
    }

    const rfp = await prisma.rfp.findUnique({ where: { id } });
    if (!rfp) return res.status(404).json({ error: 'RFP not found' });

    const vendors = await prisma.vendor.findMany({
      where: { id: { in: vendorIds } }
    });

    // Determine reply-to email (use inbound parse subdomain if configured)
    const replyToEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com';

    const results = [];
    for (const vendor of vendors) {
      try {
        // Use the professional email template
        await sendRfpEmail({
          vendorEmail: vendor.email,
          vendorName: vendor.name,
          vendorId: vendor.id,
          rfpId: rfp.id,
          rfpTitle: rfp.title,
          rfpDescription: rfp.description,
          items: rfp.items,
          budget: rfp.budget || undefined,
          deliveryDays: rfp.deliveryDays || undefined,
          paymentTerms: rfp.paymentTerms || undefined,
          warranty: rfp.warranty || undefined,
          replyToEmail,
        });

        console.log(`✅ RFP sent to ${vendor.name} (${vendor.email})`);
        results.push({
          vendorId: vendor.id,
          vendorName: vendor.name,
          vendorEmail: vendor.email,
          status: 'sent'
        });
      } catch (err: any) {
      }
    }

    const successCount = results.filter(r => r.status === 'sent').length;
    const failCount = results.filter(r => r.status === 'failed').length;

    console.log(`📊 RFP sending complete: ${successCount} sent, ${failCount} failed`);

    return res.json({
      message: 'Process complete',
      summary: {
        total: results.length,
        sent: successCount,
        failed: failCount,
      },
      results
    });
  } catch (error) {
    console.error('❌ Error sending emails:', error);
    return res.status(500).json({ error: 'Failed to send emails' });
  }
};

export const getRfpProposals = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const proposals = await prisma.proposal.findMany({
      where: { rfpId: id },
      include: { vendor: true },
      orderBy: [
        { score: 'desc' }, // High score first
        { totalPrice: 'asc' } // Then low price
      ]
    });

    // Check RFP status
    const rfp = await prisma.rfp.findUnique({ where: { id } });

    if (rfp?.status === 'Closed') {
        // If closed, maybe show only accepted one, or all but allow no actions?
        // User asked: "in a close RFP we show only that proposal which is accepted"
        const accepted = proposals.filter(p => p.status === 'Accepted');
        return res.json(accepted);
    }

    return res.json(proposals);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch proposals' });
  }
};

export const confirmProposal = async (req: Request, res: Response) => {
    try {
        const { id, proposalId } = req.params; // id is RFP id

        // Transaction to ensure data integrity
        await prisma.$transaction(async (tx) => {
            // 1. Mark this proposal as Accepted
            await tx.proposal.update({
                where: { id: proposalId },
                data: { status: 'Accepted' }
            });

            // 2. Mark all FIRST other proposals for this RFP as Rejected
            await tx.proposal.updateMany({
                where: {
                    rfpId: id,
                    id: { not: proposalId }
                },
                data: { status: 'Rejected' }
            });

            // 3. Mark RFP as Closed
            await tx.rfp.update({
                where: { id },
                data: { status: 'Closed' }
            });
        });

        return res.json({ message: 'Proposal confirmed and RFP closed' });
    } catch (error) {
        console.error("Error confirming proposal:", error);
        return res.status(500).json({ error: 'Failed to confirm proposal' });
    }
}

export const rejectProposal = async (req: Request, res: Response) => {
    try {
        const { proposalId } = req.params;

        await prisma.proposal.update({
            where: { id: proposalId },
            data: { status: 'Rejected' }
        });

        return res.json({ message: 'Proposal rejected' });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to reject proposal' });
    }
}
