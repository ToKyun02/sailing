import { z } from 'zod';

/** 수집 소스. 새 크롤러를 붙이면 여기에 추가한다. */
export const crawlerSourceSchema = z.enum(['ppomppu']);
export type CrawlerSource = z.infer<typeof crawlerSourceSchema>;

/** ok: 쇼핑몰, 상품명, 가격을 모두 뽑음 · partial: 일부만 뽑음 · failed: 제목 형식을 못 읽음 */
export const parseStatusSchema = z.enum(['ok', 'partial', 'failed']);
export type ParseStatus = z.infer<typeof parseStatusSchema>;

const count = z.number().int().nonnegative().nullable();
const won = z.number().int().nonnegative().nullable();

/**
 * 모든 크롤러가 돌려주는 공통 결과 한 건.
 * BaseCrawler가 이 스키마로 검사하므로, 어긋난 값을 내는 크롤러는 실행이 실패한다.
 *
 * @example 제목을 다 읽은 경우
 * {
 *   source: 'ppomppu',
 *   sourcePostId: '751360',
 *   postUrl: 'https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=751360',
 *   rawTitle: '[지마켓] 스테인리스 텀블러 500ml (8,900원/3,000원)',
 *   mallName: '지마켓',
 *   productName: '스테인리스 텀블러 500ml',
 *   price: 8900,
 *   shippingFee: 3000,
 *   postedAt: '2026-11-24T05:28:50.000Z',
 *   commentCount: 3,
 *   viewCount: 120,
 *   likeCount: 5,
 *   parseStatus: 'ok',
 *   crawledAt: '2026-11-24T05:30:00.000Z',
 * }
 */
export const crawlerItemSchema = z.strictObject({
  /** 어느 플랫폼에서 왔는지. 예: 'ppomppu' */
  source: crawlerSourceSchema,
  /** 플랫폼 안에서의 게시글 번호. source와 묶어 중복을 거른다. 예: '751360' */
  sourcePostId: z.string().min(1),
  /** 원문 게시글 주소 (https만). 예: 'https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=751360' */
  postUrl: z.url({ protocol: /^https$/ }),
  /** 가공 전 제목 그대로. 파싱에 실패해도 남긴다. 예: '[지마켓] 스테인리스 텀블러 500ml (8,900원/3,000원)' */
  rawTitle: z.string().min(1),
  /** 제목 앞 [ ] 안의 쇼핑몰 이름, 없으면 null. 예: '지마켓' */
  mallName: z.string().min(1).nullable(),
  /** 쇼핑몰과 가격 괄호를 뺀 상품명. 예: '스테인리스 텀블러 500ml' */
  productName: z.string().min(1),
  /** 판매가(원), 못 읽으면 null. 예: 8900 */
  price: won,
  /** 배송비(원). 0이면 무료배송, null이면 알 수 없음. 예: 3000 */
  shippingFee: won,
  /** 게시글 작성 시각 (ISO, UTC), 못 읽으면 null. 예: '2026-11-24T05:28:50.000Z' */
  postedAt: z.iso.datetime().nullable(),
  /** 댓글 수, 플랫폼이 주지 않으면 null. 예: 3 */
  commentCount: count,
  /** 조회 수, 플랫폼이 주지 않으면 null. 예: 120 */
  viewCount: count,
  /** 추천 수, 플랫폼이 주지 않으면 null. 예: 5 */
  likeCount: count,
  /** 제목 파싱 결과. 예: 'ok' */
  parseStatus: parseStatusSchema,
  /** 우리가 수집한 시각 (ISO, UTC). 예: '2026-11-24T05:30:00.000Z' */
  crawledAt: z.iso.datetime(),
});
export type CrawlerItem = z.infer<typeof crawlerItemSchema>;
