import { ProposalSchema, ProposalType, RfpSchema, RfpType } from "../types/index"
import {safeParseJson} from "../utils/helper"
import { emailTextPrompt, generateRFPPrompt, rfpModel, proposalModel } from '../constants';
import z from 'zod';

export const generateRfpFromDescription = async (description: string): Promise<RfpType> => {
  const prompt = generateRFPPrompt(description);

  try {
    const result = await rfpModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error('Empty response from Gemini API');
    }

    const parsed = safeParseJson(text);
    const validated = RfpSchema.parse(parsed);

    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', JSON.stringify(error.errors, null, 2));
      throw new Error(`Invalid RFP structure: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }

    console.error('RFP generation error:', error);
    throw new Error(`Failed to generate RFP: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const parseProposalFromEmail = async (emailText: string): Promise<ProposalType> => {
  const prompt = emailTextPrompt(emailText);

  try {
    const result = await proposalModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No content in response');
    }

    const parsed = safeParseJson(text);

    const validated = ProposalSchema.parse(parsed);

    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', JSON.stringify(error.errors, null, 2));
      throw new Error(`Invalid proposal structure: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }

    throw new Error(`Failed to parse proposal: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const rateProposal = async (rfp: RfpType, proposalData: any): Promise<{ score: number; reason: string }> => {
  const prompt = `
    You are an AI procurement assistant. Evaluate the following vendor proposal against the RFP requirements.

    RFP Details:
    Title: ${rfp.title}
    Description: ${rfp.description}
    Budget: ${rfp.budget || 'N/A'}
    Delivery Required: ${rfp.deliveryDays || 'N/A'} days
    Payment Terms: ${rfp.paymentTerms || 'N/A'}
    Warranty Required: ${rfp.warranty || 'N/A'}
    Items: ${JSON.stringify(rfp.items)}

    Vendor Proposal:
    Total Price: ${proposalData.totalPrice || 'N/A'}
    Delivery Offered: ${proposalData.deliveryDays || 'N/A'} days
    Payment Terms: ${proposalData.paymentTerms || 'N/A'}
    Warranty Offered: ${proposalData.warranty || 'N/A'}

    Task:
    1. Score the proposal from 0 to 100 based on how well it matches the RFP.
       - Price within budget? (+pts)
       - Delivery meets deadline? (+pts)
       - Warranty matches? (+pts)
    2. Provide a short, 1-sentence reason for the score.

    Return JSON format only:
    {
      "score": number,
      "reason": "string"
    }
  `;

  try {
    const result = await proposalModel.generateContent(prompt);
    const text = result.response.text();
    const parsed = safeParseJson(text);
    return {
      score: parsed.score || 0,
      reason: parsed.reason || "No analysis provided."
    };
  } catch (error) {
    console.error("Error rating proposal:", error);
    return { score: 0, reason: "Failed to rate proposal." };
  }
};
