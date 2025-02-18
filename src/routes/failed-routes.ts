import { createPlaywrightRouter } from "crawlee";
import { gotScraping } from "got-scraping";
import { LinkStatus } from "../types/page.model.js";
import { prepareLogData } from "../services/crawl.service.js";

export const failedRouter = createPlaywrightRouter();

failedRouter.addDefaultHandler(async ({ request, response, page, log, pushData }) => {
  const { datasetStorage, currentPageDomain, logObject } = await prepareLogData(request, response, page, log);

  /**
   * Use gotScraping to call the resouece, sometimes enqueueLinks can be wrong
   * Current Http headers to be included for using gotScraping
   *
   * gotScraping can fail, which we capture in
   */
  try {
    const scrapingResponse = await gotScraping(request.url, {
      timeout: {
        request: 5000,
      },
      headers: {
        Referer: currentPageDomain ?? "",
      },
    });

    // If status code shows success, logs this
    if (scrapingResponse.statusCode >= 200 && scrapingResponse.statusCode < 300) {
      logObject.contentType = scrapingResponse.headers["content-type"] ?? "Unknown";
      logObject.brokenCheck = LinkStatus.Ok;
      logObject.status = scrapingResponse.statusCode;
      logObject.title = request.url;
    }
  } catch {
    // To add any error if needed
    log.error(`gotScraping error - ${request.url}`);
  }

  // If the first page throws error, likely to have no datasetStorage data
  await pushData(logObject, datasetStorage.trim().length === 0 ? currentPageDomain : datasetStorage);
});
