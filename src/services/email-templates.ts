import { sendEmail } from './email';

/**
 * Send RFP to vendor with professional formatting
 */
export const sendRfpEmail = async (params: {
  vendorEmail: string;
  vendorName: string;
  vendorId: string;
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
    vendorId,
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
          <td style="padding: 10px; border: 1px solid #ddd;">${index + 1}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${item?.name || item?.description || 'N/A'}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${item?.qty || 'N/A'}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${item?.specs || 'N/A'}</td>
        </tr>
      `
        )
        .join('')
    : '<tr><td colspan="4" style="padding: 10px; border: 1px solid #ddd;">No items specified</td></tr>';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Request for Proposal</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">

      <div style="border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 24px; color: #000;">Request for Proposal</h1>
        <div style="margin-top: 15px; font-size: 14px; color: #555;">
          <p style="margin: 5px 0;"><strong>RFP Reference:</strong> ${rfpId}</p>
          <p style="margin: 5px 0;"><strong>Vendor ID:</strong> ${vendorId}</p>
        </div>
      </div>

      <p style="margin-bottom: 20px;">Dear ${vendorName},</p>

      <p style="margin-bottom: 20px;">You are invited to submit a proposal for the following project requirements:</p>

      <div style="background: #f9f9f9; padding: 20px; border: 1px solid #eee; margin-bottom: 30px;">
        <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #000;">${rfpTitle}</h2>
        <p style="margin: 0;">${rfpDescription}</p>
      </div>

      <h3 style="font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 15px; margin-top: 30px;">Required Items</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px;">
        <thead>
          <tr style="background: #f0f0f0;">
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd; width: 50px;">#</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Item Description</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd; width: 80px;">Qty</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Specifications</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <h3 style="font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 15px;">Project Particulars</h3>
      <div style="margin-bottom: 30px;">
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${budget ? `<li style="padding: 5px 0; border-bottom: 1px solid #eee;"><strong>Target Budget:</strong> $${budget.toLocaleString()}</li>` : ''}
          ${deliveryDays ? `<li style="padding: 5px 0; border-bottom: 1px solid #eee;"><strong>Required Delivery:</strong> ${deliveryDays} days</li>` : ''}
          ${paymentTerms ? `<li style="padding: 5px 0; border-bottom: 1px solid #eee;"><strong>Payment Terms:</strong> ${paymentTerms}</li>` : ''}
          ${warranty ? `<li style="padding: 5px 0; border-bottom: 1px solid #eee;"><strong>Warranty:</strong> ${warranty}</li>` : ''}
        </ul>
      </div>

      <div style="background: #fff; border: 1px solid #333; padding: 20px; margin-top: 30px;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px;">Submission Instructions</h3>
        <p style="margin: 0; font-size: 14px;">
          Please reply directly to this email with your proposal attached or inline.<br>
          <strong>IMPORTANT: Do not change the subject line "RFP-${rfpId}" to ensure automatic processing.</strong>
        </p>
      </div>

      <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; color: #777; font-size: 13px;">
        <p style="margin: 0;">Best Regards,</p>
        <p style="margin: 5px 0 0 0; font-weight: bold; color: #333;">Procurement Team</p>
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
${vendorId ? `Vendor ID: ${vendorId}` : ''}

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
