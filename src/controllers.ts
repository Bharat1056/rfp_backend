import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateRfpFromDescription, parseProposalFromEmail } from './services/gemini';
import { sendEmail } from './services/email';

const prisma = new PrismaClient();

// --- RFP Controllers ---

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

    const results = [];
    for (const vendor of vendors) {
      try {
        await sendEmail({
          to: vendor.email,
          subject: `RFP: ${rfp.title}`,
          html: `
            <h1>Request for Proposal: ${rfp.title}</h1>
            <p>${rfp.description}</p>
            <h3>Items:</h3>
            <pre>${JSON.stringify(rfp.items, null, 2)}</pre>
            <p>Budget: ${rfp.budget || 'N/A'}</p>
            <p>Please reply to this email with your proposal.</p>
          `
        });
        results.push({ vendorId: vendor.id, status: 'sent' });
      } catch (err) {
        results.push({ vendorId: vendor.id, status: 'failed', error: err });
      }
    }

    return res.json({ message: 'Process complete', results });
  } catch (error) {
    console.error('Error sending emails:', error);
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

// --- Vendor Controllers ---

export const createVendor = async (req: Request, res: Response) => {
  try {
    const { name, email, category } = req.body;
    const vendor = await prisma.vendor.create({
      data: { name, email, category }
    });
    return res.status(201).json(vendor);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create vendor' });
  }
};

export const getAllVendors = async (req: Request, res: Response) => {
  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: { name: 'asc' }
    });
    return res.json(vendors);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch vendors' });
  }
};

// --- Inbound Email Stub ---

export const handleInboundEmail = async (req: Request, res: Response) => {
  try {
    const { from, subject, text, rfpId, vendorId } = req.body;

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

    return res.status(201).json(proposal);
  } catch (error) {
    console.error('Error processing inbound email:', error);
    return res.status(500).json({ error: 'Failed to process email' });
  }
};
