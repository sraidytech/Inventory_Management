import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";
import { ApiError, createErrorResponse, createApiResponse } from "./api-error";
import { auth } from "@clerk/nextjs/server";

export interface RouteParams {
  params: Promise<{
    id: string;
    [key: string]: unknown;
  }>;
}

export type HandlerFunction = (
  req: NextRequest,
  params: RouteParams,
  userId: string
) => Promise<unknown>;

export function withValidation(schema: ZodSchema, handler: HandlerFunction) {
  return async (req: NextRequest, params: RouteParams) => {
    try {
      const { userId } = await auth();
      
      if (!userId) {
        throw ApiError.Unauthorized();
      }

      let body = undefined;
      if (req.method !== "GET" && req.method !== "DELETE") {
        body = await req.json();
        const validationResult = schema.safeParse(body);
        
        if (!validationResult.success) {
          const errors: Record<string, string[]> = {};
          validationResult.error.errors.forEach((error) => {
            const path = error.path.join(".");
            if (!errors[path]) {
              errors[path] = [];
            }
            errors[path].push(error.message);
          });
          
          throw ApiError.BadRequest("Validation failed", errors);
        }
      }

      const result = await handler(req, params, userId);
      return NextResponse.json(createApiResponse(result));

    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json(
          createErrorResponse(error),
          { status: error.statusCode }
        );
      }

      console.error("Unhandled error:", error);
      return NextResponse.json(
        createErrorResponse(ApiError.InternalServer()),
        { status: 500 }
      );
    }
  };
}

export function withAuth(handler: HandlerFunction) {
  return async (req: NextRequest, params: RouteParams) => {
    try {
      const { userId } = await auth();
      
      if (!userId) {
        throw ApiError.Unauthorized();
      }

      const result = await handler(req, params, userId);
      return NextResponse.json(createApiResponse(result));

    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json(
          createErrorResponse(error),
          { status: error.statusCode }
        );
      }

      console.error("Unhandled error:", error);
      return NextResponse.json(
        createErrorResponse(ApiError.InternalServer()),
        { status: 500 }
      );
    }
  };
}

export async function validateRequest<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<T> {
  const body = await req.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    const errors: Record<string, string[]> = {};
    result.error.errors.forEach((error) => {
      const path = error.path.join(".");
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(error.message);
    });

    throw ApiError.BadRequest("Validation failed", errors);
  }

  return result.data;
}
