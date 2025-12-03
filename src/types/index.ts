import { z } from 'zod';

export const RfpItemSchema = z.object({
  name: z.string().describe("Name of the item"),
  qty: z.number().describe("Quantity required"),
  specs: z.string().describe("Technical specifications")
});


export const RfpSchema = z.object({
  title: z.string().describe("Short descriptive title for the RFP"),
  description: z.string().describe("Refined professional description"),
  items: z.array(RfpItemSchema).describe("List of items to be procured"),
  budget: z.number().nullable().optional().describe("Estimated budget if mentioned"),
  deliveryDays: z.number().nullable().optional().describe("Required delivery days if mentioned"),
  paymentTerms: z.string().nullable().optional().describe("Payment terms if mentioned"),
  warranty: z.string().nullable().optional().describe("Warranty requirements if mentioned")
});

export type RfpType = z.infer<typeof RfpSchema>;

export const PriceBreakdownItemSchema = z.object({
  item: z.string().describe("Item name"),
  unit: z.number().describe("Unit price"),
  qty: z.number().describe("Quantity")
});

export const ProposalSchema = z.object({
  totalPrice: z.number().nullable().optional().describe("Total price quoted"),
  deliveryDays: z.number().nullable().optional().describe("Delivery timeline in days"),
  warranty: z.string().nullable().optional().describe("Warranty offered"),
  priceBreakdown: z.array(PriceBreakdownItemSchema).nullable().optional().describe("Breakdown of prices per item")
});

export type ProposalType = z.infer<typeof ProposalSchema>;
