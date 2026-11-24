import { Inject, Injectable, Logger } from '@nestjs/common';
import type { BaseCrawler } from './common/base-crawler.js';
import type { CrawlerItem, CrawlerSource } from './common/crawler-item.schema.js';
import { CRAWLERS } from './crawler.constants.js';

export interface CrawlResult {
  source: CrawlerSource;
  fetched: number;
  added: number;
  parseFailed: number;
}

/** DB를 붙이기 전까지 메모리에만 최근 특가를 들고 있는다. */
const MAX_STORED = 500;

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly items = new Map<string, CrawlerItem>();

  constructor(@Inject(CRAWLERS) private readonly crawlers: BaseCrawler[]) {}

  /** 모든 소스를 차례로 수집한다. 한 소스가 실패해도 나머지는 계속한다. */
  async crawlAll(): Promise<CrawlResult[]> {
    const results: CrawlResult[] = [];
    for (const crawler of this.crawlers) {
      try {
        results.push(await this.runCrawler(crawler));
      } catch (err) {
        this.logger.error(`${crawler.source} 수집 실패: ${(err as Error).message}`);
      }
    }
    return results;
  }

  findAll(): CrawlerItem[] {
    return [...this.items.values()].sort((a, b) => (b.postedAt ?? '').localeCompare(a.postedAt ?? ''));
  }

  private async runCrawler(crawler: BaseCrawler): Promise<CrawlResult> {
    const fetched = await crawler.run();
    let added = 0;
    for (const item of fetched) {
      const key = keyOf(item);
      if (!this.items.has(key)) added++;
      this.items.set(key, item);
    }
    this.trim();

    const result: CrawlResult = {
      source: crawler.source,
      fetched: fetched.length,
      added,
      parseFailed: fetched.filter((i) => i.parseStatus === 'failed').length,
    };

    this.logger.log(`${result.source} 수집: ${result.fetched}건 중 새 글 ${result.added}건, 제목 파싱 실패 ${result.parseFailed}건`);
    return result;
  }

  private trim(): void {
    if (this.items.size <= MAX_STORED) return;
    const keep = this.findAll().slice(0, MAX_STORED);
    this.items.clear();
    for (const item of keep) this.items.set(keyOf(item), item);
  }
}

function keyOf(item: CrawlerItem): string {
  return `${item.source}:${item.sourcePostId}`;
}
