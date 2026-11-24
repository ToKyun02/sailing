import type { ParseStatus } from './crawler-item.schema.js';

export interface ParsedDealTitle {
  mallName: string | null;
  productName: string;
  price: number | null;
  shippingFee: number | null;
  parseStatus: ParseStatus;
}

const MALL_PREFIX = /^\[([^\]]+)\]\s*/;
const PAREN_GROUP = /\(([^()]*)\)/g;
const LEADING_TAG = /^\((?:끌올|재업|재등록)\)\s*/;
const FREE_SHIPPING = /무료|무배|free/i;
// "22,020원", "카드가26,420원", "22800", "3000원": 콤마 단위가 있거나, "원"이 붙었거나, 세 자리 이상인 숫자
const WON = /(\d{1,3}(?:,\d{3})+|\d{3,})\s*원?|(\d+)\s*원/;

/**
 * 핫딜 게시판의 `[쇼핑몰] 상품명 (가격/배송비)` 형식 제목을 나눈다.
 * 가격 괄호는 뒤에서부터 찾고, '/' 또는 ', '로 가격과 배송비가 나뉜 괄호만 인정한다.
 */
export function parseDealTitle(title: string): ParsedDealTitle {
  let rest = title.trim();

  let mallName: string | null = null;
  const mall = MALL_PREFIX.exec(rest);
  if (mall) {
    mallName = mall[1].trim() || null;
    rest = rest.slice(mall[0].length);
  }

  let price: number | null = null;
  let shippingFee: number | null = null;
  let productName = rest;

  const groups = [...rest.matchAll(PAREN_GROUP)];
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i];
    const parsed = parsePriceGroup(group[1]);
    if (!parsed) continue;
    price = parsed.price;
    shippingFee = parsed.shippingFee;
    const before = rest.slice(0, group.index).trim();
    const after = rest.slice(group.index + group[0].length).trim();
    productName = [before, after].filter(Boolean).join(' ');
    break;
  }

  productName = productName.replace(LEADING_TAG, '').trim();

  return {
    mallName,
    productName,
    price,
    shippingFee,
    parseStatus: statusOf(mallName, productName, price),
  };
}

function parsePriceGroup(content: string): { price: number | null; shippingFee: number | null } | null {
  let cut = content.indexOf('/');
  let sepLength = 1;
  if (cut < 0) {
    const comma = /,\s/.exec(content);
    if (!comma) return null;
    cut = comma.index;
    sepLength = comma[0].length;
  }
  const pricePart = content.slice(0, cut);
  const shippingPart = content.slice(cut + sepLength);

  const price = parseWon(pricePart);
  const shippingFee = FREE_SHIPPING.test(shippingPart) ? 0 : parseWon(shippingPart);

  // 가격도 배송비도 못 읽으면 가격 괄호가 아니다 (예: "(1+1/2+1)")
  if (price === null && shippingFee === null) return null;
  return { price, shippingFee };
}

function parseWon(text: string): number | null {
  const m = WON.exec(text);
  if (!m) return null;
  const digits = (m[1] ?? m[2]).replaceAll(',', '');
  const value = Number(digits);
  return Number.isFinite(value) ? value : null;
}

function statusOf(mallName: string | null, productName: string, price: number | null): ParseStatus {
  if (mallName && productName && price !== null) return 'ok';
  if (mallName || price !== null) return 'partial';
  return 'failed';
}
