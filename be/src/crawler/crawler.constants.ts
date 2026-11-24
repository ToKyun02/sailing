/** 등록된 모든 BaseCrawler 배열을 주입받는 토큰 */
export const CRAWLERS = Symbol('CRAWLERS');

/** SchedulerRegistry에서 찾을 때 쓰는 크론 작업 이름 */
export const CRAWL_ALL_JOB = 'crawl-all';
