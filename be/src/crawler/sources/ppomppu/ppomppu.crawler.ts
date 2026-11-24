import { Injectable } from '@nestjs/common';
import { BaseCrawler } from '../../common/base-crawler.js';
import type { CrawlerItem } from '../../common/crawler-item.schema.js';
import { parsePpomppuRss } from './ppomppu-rss.parser.js';

export const PPOMPPU_RSS_URL = 'https://www.ppomppu.co.kr/rss.php?id=ppomppu';
const USER_AGENT = 'saling-crawler/0.1';
const TIMEOUT_MS = 10_000;

@Injectable()
export class PpomppuCrawler extends BaseCrawler {
  readonly source = 'ppomppu' as const;

  protected async crawl(now: Date): Promise<CrawlerItem[]> {
    const res = await fetch(PPOMPPU_RSS_URL, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new Error(`뽐뿌 RSS 요청 실패: HTTP ${res.status}`);
    }
    return parsePpomppuRss(await res.text(), now);
  }
}
