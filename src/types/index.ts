import { z } from 'zod';
import { Schema, SchemaType } from '@google/generative-ai';

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
  paymentTerms: z.string().nullable().optional().describe("Payment terms if mentioned"),
  warranty: z.string().nullable().optional().describe("Warranty offered"),
  priceBreakdown: z.array(PriceBreakdownItemSchema).nullable().optional().describe("Breakdown of prices per item")
});

export type ProposalType = z.infer<typeof ProposalSchema>;

export const rfpJsonSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    title: {
      type: SchemaType.STRING,
      description: "Short descriptive title for the RFP"
    },
    description: {
      type: SchemaType.STRING,
      description: "Refined professional description"
    },
    items: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: {
            type: SchemaType.STRING,
            description: "Name of the item"
          },
          qty: {
            type: SchemaType.NUMBER,
            description: "Quantity required"
          },
          specs: {
            type: SchemaType.STRING,
            description: "Technical specifications"
          }
        },
        required: ["name", "qty", "specs"]
      },
      description: "List of items to be procured"
    },
    budget: {
      type: SchemaType.NUMBER,
      nullable: true,
      description: "Estimated budget if mentioned"
    },
    deliveryDays: {
      type: SchemaType.NUMBER,
      nullable: true,
      description: "Required delivery days if mentioned"
    },
    paymentTerms: {
      type: SchemaType.STRING,
      nullable: true,
      description: "Payment terms if mentioned"
    },
    warranty: {
      type: SchemaType.STRING,
      nullable: true,
      description: "Warranty requirements if mentioned"
    }
  },
  required: ["title", "description", "items"]
};

export const proposalJsonSchema: Schema = {
  type:SchemaType.OBJECT,
  properties: {
    totalPrice: {
      type: SchemaType.NUMBER,
      nullable: true,
      description: "Total price quoted"
    },
    deliveryDays: {
      type: SchemaType.NUMBER,
      nullable: true,
      description: "Delivery timeline in days"
    },
    paymentTerms: {
      type: SchemaType.STRING,
      nullable: true,
      description: "Payment terms if mentioned"
    },
    warranty: {
      type: SchemaType.STRING,
      nullable: true,
      description: "Warranty offered"
    },
    priceBreakdown: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          item: {
            type: SchemaType.STRING,
            description: "Item name"
          },
          unit: {
            type: SchemaType.NUMBER,
            description: "Unit price"
          },
          qty: {
            type: SchemaType.NUMBER,
            description: "Quantity"
          }
        },
        required: ["item", "unit", "qty"]
      },
      nullable: true,
      description: "Breakdown of prices per item"
    }
  }
};

