import dotenv from 'dotenv';
import { ProposalSchema, ProposalType, RfpSchema, RfpType } from "../types/index"
import {safeParseJson} from "../utils/helper"
import { emailTextPrompt, generateRFPPrompt, rfpModel, proposalModel } from '../constants';
import z from 'zod';

dotenv.config();

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

    console.error('Proposal parsing error:', error);
    throw new Error(`Failed to parse proposal: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
