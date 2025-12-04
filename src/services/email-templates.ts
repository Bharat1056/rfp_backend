import { sendEmail } from './email';

/**
 * Send RFP to vendor with professional formatting
 */
export const sendRfpEmail = async (params: {
  vendorEmail: string;
  vendorName: string;
  rfpId: string;
  rfpTitle: string;
  rfpDescription: string;
  items: any;
  budget?: number;
  deliveryDays?: number;
  paymentTerms?: string;
  warranty?: string;
  replyToEmail: string;
}) => {
  const {
    vendorEmail,
    vendorName,
    rfpId,
    rfpTitle,
    rfpDescription,
    items,
    budget,
    deliveryDays,
    paymentTerms,
    warranty,
    replyToEmail,
  } = params;

  const itemsHtml = Array.isArray(items)
    ? items
        .map(
          (item: any, index: number) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.name || item.description || 'N/A'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.quantity || 'N/A'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.specifications || 'N/A'}</td>
        </tr>
      `
        )
        .join('')
    : '<tr><td colspan="4" style="padding: 8px;">No items specified</td></tr>';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Request for Proposal</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">Request for Proposal</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">RFP ID: ${rfpId}</p>
      </div>

      <!-- Content -->
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">

        <!-- Greeting -->
        <p style="font-size: 16px; margin-bottom: 20px;">Dear ${vendorName},</p>

        <p style="font-size: 16px; margin-bottom: 20px;">
          We are pleased to invite you to submit a proposal for the following project:
        </p>

        <!-- Project Title -->
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #667eea;">
          <h2 style="margin: 0 0 10px 0; color: #667eea; font-size: 22px;">${rfpTitle}</h2>
          <p style="margin: 0; color: #6b7280;">${rfpDescription}</p>
        </div>

        <!-- Items Table -->
        <h3 style="color: #374151; margin-top: 25px; margin-bottom: 15px; font-size: 18px;">📋 Required Items/Services</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">#</th>
              <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Item</th>
              <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Quantity</th>
              <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Specifications</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Project Details -->
        <h3 style="color: #374151; margin-top: 25px; margin-bottom: 15px; font-size: 18px;">📊 Project Details</h3>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          ${budget ? `<p style="margin: 0 0 10px 0;"><strong>Budget:</strong> $${budget.toLocaleString()}</p>` : ''}
          ${deliveryDays ? `<p style="margin: 0 0 10px 0;"><strong>Delivery Timeline:</strong> ${deliveryDays} days</p>` : ''}
          ${paymentTerms ? `<p style="margin: 0 0 10px 0;"><strong>Payment Terms:</strong> ${paymentTerms}</p>` : ''}
          ${warranty ? `<p style="margin: 0;"><strong>Warranty Requirements:</strong> ${warranty}</p>` : ''}
        </div>

        <!-- Submission Instructions -->
        <h3 style="color: #374151; margin-top: 25px; margin-bottom: 15px; font-size: 18px;">✉️ How to Submit Your Proposal</h3>
        <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <p style="margin: 0 0 10px 0; color: #92400e;">
            <strong>Important:</strong> Please reply to this email with your proposal.
          </p>
          <p style="margin: 0 0 10px 0; color: #92400e;">
            Make sure to <strong>keep "RFP-${rfpId}"</strong> in the subject line so we can automatically process your proposal.
          </p>
          <p style="margin: 0; color: #92400e;">
            Include your pricing, timeline, and any relevant details in your response.
          </p>
        </div>

        <!-- Footer -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 10px 0; color: #6b7280;">
            If you have any questions, please don't hesitate to reach out.
          </p>
          <p style="margin: 0; color: #6b7280;">
            We look forward to receiving your proposal.
          </p>
          <p style="margin: 20px 0 0 0; color: #6b7280;">
            Best regards,<br>
            <strong>RFP Manager Team</strong>
          </p>
        </div>
      </div>

      <!-- Footer Note -->
      <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">This is an automated message from RFP Manager</p>
        <p style="margin: 5px 0 0 0;">Reference ID: ${rfpId}</p>
      </div>
    </body>
    </html>
  `;

  const text = `
Request for Proposal
RFP ID: ${rfpId}

Dear ${vendorName},

We are pleased to invite you to submit a proposal for the following project:

PROJECT: ${rfpTitle}
${rfpDescription}

REQUIRED ITEMS/SERVICES:
${Array.isArray(items) ? items.map((item: any, i: number) => `${i + 1}. ${item.name || item.description || 'N/A'} - Qty: ${item.quantity || 'N/A'}`).join('\n') : 'No items specified'}

PROJECT DETAILS:
${budget ? `Budget: $${budget.toLocaleString()}` : ''}
${deliveryDays ? `Delivery Timeline: ${deliveryDays} days` : ''}
${paymentTerms ? `Payment Terms: ${paymentTerms}` : ''}
${warranty ? `Warranty Requirements: ${warranty}` : ''}

HOW TO SUBMIT YOUR PROPOSAL:
Please reply to this email with your proposal. Make sure to keep "RFP-${rfpId}" in the subject line so we can automatically process your proposal.

If you have any questions, please don't hesitate to reach out.

We look forward to receiving your proposal.

Best regards,
RFP Manager Team

---
Reference ID: ${rfpId}
  `.trim();

  return await sendEmail({
    to: vendorEmail,
    subject: `RFP-${rfpId}: ${rfpTitle}`,
    html,
    text,
    replyTo: replyToEmail,
  });
};

/**
 * Send proposal confirmation to vendor
 */
export const sendProposalConfirmation = async (params: {
  vendorEmail: string;
  vendorName: string;
  rfpTitle: string;
  proposalId: string;
}) => {
  const { vendorEmail, vendorName, rfpTitle, proposalId } = params;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Proposal Received</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">✅ Proposal Received</h1>
      </div>

      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Dear ${vendorName},</p>

        <p style="font-size: 16px; margin-bottom: 20px;">
          Thank you for submitting your proposal for <strong>${rfpTitle}</strong>.
        </p>

        <div style="background: #f0fdf4; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <p style="margin: 0; color: #065f46;">
            <strong>Proposal ID:</strong> ${proposalId}
          </p>
        </div>

        <p style="font-size: 16px; margin-bottom: 20px;">
          We have successfully received and processed your proposal. Our team will review it and get back to you soon.
        </p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280;">
            Best regards,<br>
            <strong>RFP Manager Team</strong>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Proposal Received

Dear ${vendorName},

Thank you for submitting your proposal for ${rfpTitle}.

Proposal ID: ${proposalId}

We have successfully received and processed your proposal. Our team will review it and get back to you soon.

Best regards,
RFP Manager Team
  `.trim();

  return await sendEmail({
    to: vendorEmail,
    subject: `Proposal Received - ${rfpTitle}`,
    html,
    text,
  });
};

/**
 * Send notification when proposal is accepted
 */
export const sendProposalAcceptedEmail = async (params: {
  vendorEmail: string;
  vendorName: string;
  rfpTitle: string;
  totalPrice?: number;
}) => {
  const { vendorEmail, vendorName, rfpTitle, totalPrice } = params;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Proposal Accepted</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

      <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 18px;">Your Proposal Has Been Accepted</p>
      </div>

      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Dear ${vendorName},</p>

        <p style="font-size: 16px; margin-bottom: 20px;">
          We are pleased to inform you that your proposal for <strong>${rfpTitle}</strong> has been accepted!
        </p>

        ${
          totalPrice
            ? `
        <div style="background: #eff6ff; border: 1px solid #3b82f6; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
          <p style="margin: 0; color: #1e40af; font-size: 14px;">Accepted Proposal Amount</p>
          <p style="margin: 10px 0 0 0; color: #1e3a8a; font-size: 32px; font-weight: bold;">$${totalPrice.toLocaleString()}</p>
        </div>
        `
            : ''
        }

        <p style="font-size: 16px; margin-bottom: 20px;">
          Our team will contact you shortly to discuss the next steps and finalize the agreement.
        </p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 10px 0; color: #6b7280;">
            Thank you for your partnership!
          </p>
          <p style="margin: 0; color: #6b7280;">
            Best regards,<br>
            <strong>RFP Manager Team</strong>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Congratulations! Your Proposal Has Been Accepted

Dear ${vendorName},

We are pleased to inform you that your proposal for ${rfpTitle} has been accepted!

${totalPrice ? `Accepted Proposal Amount: $${totalPrice.toLocaleString()}` : ''}

Our team will contact you shortly to discuss the next steps and finalize the agreement.

Thank you for your partnership!

Best regards,
RFP Manager Team
  `.trim();

  return await sendEmail({
    to: vendorEmail,
    subject: `🎉 Proposal Accepted - ${rfpTitle}`,
    html,
    text,
  });
};
