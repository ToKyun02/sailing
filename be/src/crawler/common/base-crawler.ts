import { z } from 'zod';
import { crawlerItemSchema, type CrawlerItem, type CrawlerSource } from './crawler-item.schema.js';

/** 크롤러가 공통 스키마에 맞지 않는 값을 돌려줬을 때 던진다. */
export class CrawlerOutputError extends Error {
  readonly issues: z.ZodError['issues'];

  constructor(
    readonly source: CrawlerSource,
    error: z.ZodError,
  ) {
    super(`${source} 크롤러 결과가 스키마와 맞지 않음:\n${z.prettifyError(error)}`);
    this.name = 'CrawlerOutputError';
    this.issues = error.issues;
  }
}

/**
 * 모든 소스 크롤러의 부모. 하위 클래스는 crawl()만 구현하고,
 * 바깥에서는 결과를 검사하는 run()만 부른다.
 */
export abstract class BaseCrawler {
  abstract readonly source: CrawlerSource;

  protected abstract crawl(now: Date): Promise<CrawlerItem[]>;

  async run(now = new Date()): Promise<CrawlerItem[]> {
    const items = await this.crawl(now);
    const result = z
      .array(
        crawlerItemSchema.refine((item) => item.source === this.source, {
          message: `source는 '${this.source}'여야 함`,
          path: ['source'],
        }),
      )
      .safeParse(items);
    if (!result.success) {
      throw new CrawlerOutputError(this.source, result.error);
    }
    return result.data;
  }
}
