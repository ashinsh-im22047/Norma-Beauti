import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');
  const itemId = searchParams.get('itemId');

  try {
    let query = '';
    let params: any[] = [];

    // Fetch ONLY visible reviews for a specific standard product OR a ready-made box
    // The "AND (is_hidden = 0 OR is_hidden IS NULL)" part hides the bad reviews!
    if (productId) {
        query = 'SELECT * FROM product_reviews WHERE productid = ? AND (is_hidden = 0 OR is_hidden IS NULL) ORDER BY date DESC';
        params = [productId];
    } else if (itemId) {
        query = 'SELECT * FROM product_reviews WHERE itemid = ? AND (is_hidden = 0 OR is_hidden IS NULL) ORDER BY date DESC';
        params = [itemId];
    } else {
        return NextResponse.json([]);
    }

    const [reviews]: any = await db.query(query, params);
    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Reviews API Error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}