import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientFormSchema } from "@/lib/validations";
import { withAuth, withValidation, RouteParams } from "@/lib/api-middleware";
import { ApiError } from "@/lib/api-error";
import type { Prisma } from "@prisma/client";

// GET /api/clients/[id]
export const GET = withAuth(async (req: NextRequest, params: RouteParams, userId: string) => {
  const resolvedParams = await Promise.resolve(params.params);
  
  const client = await prisma.client.findFirst({
    where: { 
      id: resolvedParams.id,
      userId 
    },
    include: {
      _count: {
        select: { transactions: true },
      },
    },
  });

  if (!client) {
    throw ApiError.NotFound("Client not found");
  }

  return client;
});

// PUT /api/clients/[id]
export const PUT = withValidation(
  clientFormSchema,
  async (req: NextRequest, params: RouteParams, userId: string) => {
    const resolvedParams = await Promise.resolve(params.params);
    const data = await req.json();

    // Check if client exists and belongs to user
    const existingClient = await prisma.client.findFirst({
      where: { 
        id: resolvedParams.id,
        userId 
      },
    });

    if (!existingClient) {
      throw ApiError.NotFound("Client not found");
    }

    // Only check email uniqueness if email is provided in the data
    if (data.email && existingClient.email && data.email.toLowerCase() !== existingClient.email.toLowerCase()) {
      const emailExists = await prisma.client.findFirst({
        where: {
          email: {
            equals: data.email,
            mode: "insensitive" as const,
          },
          userId,
          id: {
            not: resolvedParams.id,
          },
        },
      });

      if (emailExists) {
        throw ApiError.Conflict("Client with this email already exists");
      }
    }

    // Calculate balance if totalDue and amountPaid are provided
    let balance = existingClient.balance;
    if (data.totalDue !== undefined && data.amountPaid !== undefined) {
      balance = data.totalDue - data.amountPaid;
    } else if (data.totalDue !== undefined) {
      balance = data.totalDue - existingClient.amountPaid;
    } else if (data.amountPaid !== undefined) {
      balance = existingClient.totalDue - data.amountPaid;
    }

    // Create update data with proper handling of optional fields
    const updateData: Prisma.ClientUpdateInput = {
      name: data.name,
      phone: data.phone,
      address: data.address,
      userId, // Ensure userId is preserved
      balance,
    };

    // Only include optional fields if they exist in the data
    if (data.email !== undefined) {
      updateData.email = data.email || null;
    }
    
    if (data.notes !== undefined) {
      updateData.notes = data.notes || null;
    }
    
    if (data.totalDue !== undefined) {
      updateData.totalDue = data.totalDue;
    }
    
    if (data.amountPaid !== undefined) {
      updateData.amountPaid = data.amountPaid;
    }

    const updatedClient = await prisma.client.update({
      where: { 
        id: resolvedParams.id,
        userId
      },
      data: updateData,
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return updatedClient;
  }
);

// DELETE /api/clients/[id]
export const DELETE = withAuth(
  async (req: NextRequest, params: RouteParams, userId: string) => {
    const resolvedParams = await Promise.resolve(params.params);
    
    // Check if client exists and belongs to user
    const client = await prisma.client.findFirst({
      where: { 
        id: resolvedParams.id,
        userId 
      },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!client) {
      throw ApiError.NotFound("Client not found");
    }

    // Check if client has any transactions
    if (client._count.transactions > 0) {
      throw ApiError.Conflict(
        "Cannot delete client that has associated transactions"
      );
    }

    await prisma.client.delete({
      where: { 
        id: resolvedParams.id,
        userId 
      },
    });

    return { message: "Client deleted successfully" };
  }
);
