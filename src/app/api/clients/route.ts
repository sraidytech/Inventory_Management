import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { clientSchema } from "@/lib/validations";
import { ZodError } from "zod";
import { ApiError } from "@/lib/api-error";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const userId = session?.userId;

    if (!userId) {
      throw ApiError.Unauthorized();
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const where: Prisma.ClientWhereInput = {
      userId, // Filter clients by user
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          _count: {
            select: { transactions: true },
          },
        },
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.client.count({ where }),
    ]);

    return NextResponse.json({
      clients,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, errors: error.errors },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await auth();
    const userId = session?.userId;

    if (!userId) {
      throw ApiError.Unauthorized();
    }

    // Parse request body
    const body = await req.json();

    try {
      // Add userId and validate data
      const validatedData = clientSchema.parse({
        ...body,
        userId,
      });

      // Only check for email uniqueness if email is provided
      if (validatedData.email) {
        const existingClient = await prisma.client.findFirst({
          where: {
            email: {
              equals: validatedData.email,
              mode: "insensitive",
            },
            userId,
          },
        });

        if (existingClient) {
          throw ApiError.Conflict("Client with this email already exists");
        }
      }

      // Calculate balance if totalDue and amountPaid are provided
      let balance = 0;
      if (validatedData.totalDue !== undefined && validatedData.amountPaid !== undefined) {
        balance = validatedData.totalDue - validatedData.amountPaid;
      }

      // Create client with proper data structure
      const client = await prisma.client.create({
        data: {
          name: validatedData.name,
          phone: validatedData.phone,
          address: validatedData.address,
          userId: validatedData.userId,
          email: validatedData.email || null, // Set to null if not provided
          notes: validatedData.notes || null,
          totalDue: validatedData.totalDue || 0,
          amountPaid: validatedData.amountPaid || 0,
          balance: balance,
        } as Prisma.ClientCreateInput,
        include: {
          _count: {
            select: { transactions: true },
          },
        },
      });

      return NextResponse.json({ success: true, data: client }, { status: 201 });
    } catch (dbError) {
      if (dbError instanceof Error) {
        throw ApiError.BadRequest(dbError.message);
      }
      throw ApiError.BadRequest('Failed to create client');
    }
  } catch (error) {
    console.error('Error:', error);
    if (error instanceof ZodError) {
      const errors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      return NextResponse.json(
        { error: 'Validation failed', errors },
        { status: 400 }
      );
    }
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, errors: error.errors },
        { status: error.statusCode }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Invalid client data' },
      { status: 400 }
    );
  }
}
