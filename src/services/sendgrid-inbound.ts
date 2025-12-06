import { Request, Response } from 'express';
import { parseProposalFromEmail, rateProposal } from './gemini';
import { sendProposalConfirmation } from './email-templates';
import { InboundEmailPayload, RfpType } from '../types';
import { prisma } from '../constants';

const extractEmailMetadata = async (emailData: InboundEmailPayload) => {
  try {
    const toAddress = emailData.to.toLowerCase();
    const fromAddress = emailData.from;

    const emailRegex = /<([^>]+)>|([^\s]+@[^\s]+)/;
    const fromMatch = fromAddress.match(emailRegex);
    const vendorEmail = fromMatch ? (fromMatch[1] || fromMatch[2]) : fromAddress;

    const vendor = await prisma.vendor.findFirst({
      where: {
        email: {
          contains: vendorEmail.trim(),
          mode: 'insensitive',
        },
      },
    });

    const rfpIdMatch = emailData.subject.match(/RFP[:\s-]+([a-zA-Z0-9-]+)/i) ||
                       toAddress.match(/rfp-([a-zA-Z0-9-]+)@/);

    const rfpId = rfpIdMatch ? rfpIdMatch[1] : null;

    return {
      vendorEmail,
      vendor,
      rfpId,
    };
  } catch (error) {
    console.error('Error extracting email metadata:', error);
    return {
      vendorEmail: null,
      vendor: null,
      rfpId: null,
    };
  }
};

export const handleSendGridInbound = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const emailData = req.body as InboundEmailPayload;

    const { vendor, vendorEmail, rfpId } = await extractEmailMetadata(emailData);

    if (!vendor) {
      console.warn(`Vendor not found for email: ${vendorEmail}`);
      return res.status(200).json({
        message: 'Email received but vendor not found',
        vendorEmail,
      });
    }

    if (!rfpId) {
      return res.status(200).json({
        message: 'Email received but RFP ID not found',
      });
    }

    const rfp = await prisma.rfp.findUnique({
      where: { id: rfpId },
    });

    if (!rfp) {
      return res.status(200).json({
        message: 'Email received but RFP not found',
        rfpId,
      });
    }

    const emailContent = emailData.text || emailData.html || '';

    if (!emailContent) {
      return res.status(200).json({
        message: 'Email received but has no content',
      });
    }

    const parsedData = await parseProposalFromEmail(emailContent);

    const attachments = req.files as Express.Multer.File[] || [];
    const attachmentInfo = attachments.map((file) => ({
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    }));

    const proposal = await prisma.proposal.create({
      data: {
        rfpId: rfp.id,
        vendorId: vendor.id,
        rawEmail: emailContent,
        parsedData,
        totalPrice: parsedData.totalPrice || null,
        status: 'Pending',
        score: 0,
        aiAnalysis: 'Pending analysis...',
      },
      include: {
        vendor: true,
        rfp: true,
      },
    });

    try {
        console.log("parsed data: ", parsedData)
        const rating = await rateProposal(rfp as unknown as RfpType, parsedData);

        const updates: any = {
            score: rating.score,
            aiAnalysis: rating.reason
        };

        await prisma.proposal.update({
            where: { id: proposal.id },
            data: updates
        });
        console.log(`⭐ Rated proposal: ${rating.score}/100 - ${rating.reason}`);
    } catch (rateError) {
        console.error("Failed to rate proposal:", rateError);
    }

    try {
      await sendProposalConfirmation({
        vendorEmail: vendor.email,
        vendorName: vendor.name,
        rfpTitle: rfp.title,
        proposalId: proposal.id,
      });
      console.log(`Received email from ${vendor.email}`);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    return res.status(200).json({
      success: true,
      message: 'Proposal created successfully',
      proposal: {
        id: proposal.id,
        vendorName: vendor.name,
        rfpTitle: rfp.title,
        totalPrice: parsedData.totalPrice,
      },
      attachments: attachmentInfo,
    });
  } catch (error: any) {
    return res.status(200).json({
      success: false,
      message: 'Error processing email',
      error: error.message,
    });
  }
};
