import { Request, Response } from 'express';
import { prisma } from '../constants';

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
