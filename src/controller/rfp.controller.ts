import { Request, Response } from 'express';
import { generateRfpFromDescription } from '../services/gemini';
import { sendRfpEmail } from '../services/email-templates';
import { prisma } from '../constants';

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
    const rfps = await prisma.rfp.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(rfps);
  } catch (error) {
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
    const replyToEmail = process.env.SENDGRID_INBOUND_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com';

    const results = [];
    for (const vendor of vendors) {
      try {
        // Use the professional email template
        await sendRfpEmail({
          vendorEmail: vendor.email,
          vendorName: vendor.name,
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
      include: { vendor: true }
    });
    return res.json(proposals);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch proposals' });
  }
};
