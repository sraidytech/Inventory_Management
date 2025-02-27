import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // Make a request to the products API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/products`, {
      headers: {
        // Forward the authorization header
        cookie: req.headers.get('cookie') || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
    }

    // Get the raw response
    const data = await response.json();

    // Return the raw response structure for debugging
    return NextResponse.json({
      responseStructure: {
        keys: Object.keys(data),
        success: data.success,
        hasData: !!data.data,
        hasItems: !!data.data?.items,
        itemsIsArray: Array.isArray(data.data?.items),
        itemsLength: data.data?.items?.length || 0,
        sampleItem: data.data?.items?.[0] || null,
        hasMetadata: !!data.data?.metadata,
      },
      rawResponse: data,
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
