import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CRAWL_ALL_JOB } from './crawler.constants.js';
import { CrawlerService } from './crawler.service.js';

/**
 * 수집 주기만 담당한다. ScheduleModule.forRoot()(AppModule)가 @Cron을 찾아 등록한다.
 * CRAWLER_ENABLED=false면 부팅할 때 작업을 멈춘다.
 */
@Injectable()
export class CrawlerScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(CrawlerScheduler.name);

  constructor(
    private readonly crawler: CrawlerService,
    private readonly registry: SchedulerRegistry,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS, {
    name: CRAWL_ALL_JOB,
    waitForCompletion: true,
  })
  async crawlAll(): Promise<void> {
    await this.crawler.crawlAll();
  }

  onApplicationBootstrap(): void {
    const job = this.registry.getCronJob(CRAWL_ALL_JOB);
    if (this.config.get<string>('CRAWLER_ENABLED') === 'false') {
      void job.stop();
      this.logger.log(`'${CRAWL_ALL_JOB}' 작업을 멈춤 (CRAWLER_ENABLED=false)`);
      return;
    }
    this.logger.log(`'${CRAWL_ALL_JOB}' 작업 등록됨, 다음 실행: ${job.nextDate().toISO()}`);
  }
}
