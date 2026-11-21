import { NextResponse } from 'next/server';
import { getLiveProducts, getColorHexFallback, isDefaultFeatureText } from '@/lib/api/products';
import { Product } from '@/types';

export const dynamic = 'force-dynamic';

function healProductColors(prod: Product): Product {
  const healedFeatures = (prod.features || []).filter((f) => !isDefaultFeatureText(f));
  if (!prod.colors || prod.colors.length === 0) {
    return {
      ...prod,
      features: healedFeatures,
    };
  }
  const healedColors = prod.colors.map((col) => {
    const isPaleWhiteDefault = col.hex === '#E8D6C7' || !col.hex;
    const isActuallyBeige = /beige|champagne|cream|sand|wheat/i.test(col.name);
    if (isPaleWhiteDefault && !isActuallyBeige) {
      return {
        ...col,
        hex: getColorHexFallback(col.name),
      };
    }
    return col;
  });
  return {
    ...prod,
    colors: healedColors,
    features: healedFeatures,
  };
}

export async function GET() {
  try {
    const result = await getLiveProducts();
    const healed = (result.products || []).map(healProductColors);
    return NextResponse.json({
      success: true,
      products: healed,
      isLive: result.isLive,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
