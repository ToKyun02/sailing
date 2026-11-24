import { Module } from '@nestjs/common';
import type { BaseCrawler } from './common/base-crawler.js';
import { CRAWLERS } from './crawler.constants.js';
import { CrawlerScheduler } from './crawler.scheduler.js';
import { CrawlerService } from './crawler.service.js';
import { PpomppuCrawler } from './sources/ppomppu/ppomppu.crawler.js';

/** 새 소스를 붙일 때: BaseCrawler를 상속한 클래스를 providers와 CRAWLERS의 inject에 추가한다. */
const SOURCE_CRAWLERS = [PpomppuCrawler];

@Module({
  providers: [
    ...SOURCE_CRAWLERS,
    {
      provide: CRAWLERS,
      useFactory: (...crawlers: BaseCrawler[]) => crawlers,
      inject: SOURCE_CRAWLERS,
    },
    CrawlerService,
    CrawlerScheduler,
  ],
})
export class CrawlerModule {}
