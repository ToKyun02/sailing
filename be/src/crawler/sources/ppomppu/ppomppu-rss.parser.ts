import * as cheerio from 'cheerio';
import type { CrawlerItem } from '../../common/crawler-item.schema.js';
import { parseDealTitle } from '../../common/deal-title.parser.js';

/**
 * 뽐뿌게시판 RSS(`rss.php?id=ppomppu`)를 공통 CrawlerItem 목록으로 바꾼다.
 * 본문(description)과 작성자는 저장하지 않는다.
 */
export function parsePpomppuRss(xml: string, crawledAt: Date): CrawlerItem[] {
  const $ = cheerio.load(xml, { xml: true });
  const deals: CrawlerItem[] = [];

  $('item').each((_, el) => {
    const item = $(el);
    const rawTitle = item.children('title').text().trim();
    const postUrl = toHttps(item.children('link').text().trim());
    const sourcePostId = postIdOf(postUrl);
    if (!rawTitle || !sourcePostId) return;

    const counts = parseHits(item.children('hits').text());
    deals.push({
      source: 'ppomppu',
      sourcePostId,
      postUrl,
      rawTitle,
      ...parseDealTitle(rawTitle),
      postedAt: toIso(item.children('pubDate').text()),
      ...counts,
      crawledAt: crawledAt.toISOString(),
    });
  });

  return deals;
}

function toHttps(url: string): string {
  return url.replace(/^http:\/\//, 'https://');
}

function postIdOf(url: string): string | null {
  try {
    return new URL(url).searchParams.get('no');
  } catch {
    return null;
  }
}

function toIso(date: string): string | null {
  const ms = Date.parse(date.trim());
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

/**
 * `<hits> [댓글|조회|추천|비추천]</hits>` 형식으로 보인다.
 * 칸의 의미는 피드에서 관찰한 값으로 추정한 것이라, 바뀌면 여기만 고친다.
 */
function parseHits(text: string): Pick<CrawlerItem, 'commentCount' | 'viewCount' | 'likeCount'> {
  const m = /\[(\d+)\|(\d+)\|(\d+)\|(\d+)\]/.exec(text);
  if (!m) return { commentCount: null, viewCount: null, likeCount: null };
  return {
    commentCount: Number(m[1]),
    viewCount: Number(m[2]),
    likeCount: Number(m[3]),
  };
}
