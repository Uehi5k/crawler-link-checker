import {
  Dictionary,
  LoadedRequest,
  Log,
  Request,
  Dataset,
  EnqueueLinksOptions,
  PlaywrightCrawler,
  RequestOptions,
  KeyValueStore,
  RequestQueue,
  ProxyConfiguration,
} from "crawlee";
import { Page } from "playwright";
import {
  extractImgSrc,
  extractMetaContent,
  extractScriptSrcs,
  extractStyleSheetLinks,
} from "../helpers/extraction.js";
import { createLogObject, getDomainFromURL } from "../helpers/utils.js";
import { BatchAddRequestsResult } from "@crawlee/types";
import { Direction, LinkType, PageLog } from "../types/page.model.js";
import { router } from "../routes/routes.js";
import { failedRouter } from "../routes/failed-routes.js";

// For playwright-extra you will need to import the browser type itself that you want to use!
// By default, PlaywrightCrawler uses chromium, but you can also use firefox or webkit.
import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
chromium.use(stealthPlugin());

// Singleton Crawler
export let crawler: PlaywrightCrawler | undefined;

/**
 * Prepare log data and return values
 * @param request (LoadedRequest<Request<Dictionary>>)
 * @param response (Dictionary | undefined)
 * @param page (Page)
 * @param log (Log)
 * @returns (Promise<{ datasetStorage: string, firstSourceDomain: string, currentPageDomain: string, recursiveCrawl: boolean, sameDomain: boolean, logObject: PageLog }>)
 */
export const prepareLogData = async (
  request: LoadedRequest<Request<Dictionary>>,
  response: Dictionary | undefined,
  page: Page,
  log: Log
): Promise<{
  datasetStorage: any;
  firstSourceDomain: string;
  currentPageDomain: string | null;
  recursiveCrawl: boolean;
  sameDomain: boolean;
  logObject: PageLog;
}> => {
  const datasetStorage: string = request.userData.datasetStorage ?? "";
  const firstSourceDomain: string = request.userData.firstSourceDomain ?? "";
  const firstSourceUrl = request.userData.firstSourceUrl ?? "";
  const recursiveCrawl = request.userData.recursiveCrawl ?? true;
  const linkType = request.userData.linkType ?? LinkType.Link;

  let logObject = await createLogObject(
    request,
    response,
    page,
    log,
    linkType,
    firstSourceUrl
  );

  // Drop domain crawl data, to prepare for the new crawl
  const currentPageDomain = getDomainFromURL(logObject.url);
  const sameDomain = firstSourceDomain === currentPageDomain;

  // Add Internal or External source
  if (!sameDomain) {
    logObject = { ...logObject, direction: Direction.Outbound };
  }

  return {
    datasetStorage,
    firstSourceDomain,
    currentPageDomain,
    recursiveCrawl,
    sameDomain,
    logObject,
  };
};

/**
 * Crawl page using enqueuelinks, looking for a link with href
 * It will also call enqueueLinks to repeate crawling for other links and images if from the same domain
 *
 * To be used - high level handler since it will crawl other pages
 * @param request (LoadedRequest<Request<Dictionary>>)
 * @param response (Dictionary | undefined)
 * @param page (Page)
 * @param log (Log)
 * @param pushData (createPlaywrightRouter.pushData)
 * @param enqueueLinks (createPlaywrightRouter.enqueueLinks)
 */
export const crawlPageAhrefSrc = async (
  request: LoadedRequest<Request<Dictionary>>,
  response: Dictionary | undefined,
  page: Page,
  log: Log,
  pushData: (
    data: Readonly<Parameters<Dataset["pushData"]>[0]>,
    datasetIdOrName?: string
  ) => Promise<void>,
  enqueueLinks: (
    options?: Readonly<Omit<EnqueueLinksOptions, "requestQueue">> &
      Pick<EnqueueLinksOptions, "requestQueue">
  ) => Promise<BatchAddRequestsResult>
) => {
  const {
    datasetStorage,
    firstSourceDomain,
    recursiveCrawl,
    sameDomain,
    logObject,
  } = await prepareLogData(request, response, page, log);

  await pushData(logObject, datasetStorage);

  // Queue links for current page if from the same domain
  if (sameDomain) {
    const imageUrls = await extractImgSrc(page);
    const metaUrls = await extractMetaContent(page);
    const stylesheetsUrls = await extractStyleSheetLinks(page);
    const scriptsUrls = await extractScriptSrcs(page);

    await enqueueLinks({
      label: "img-src",
      urls: imageUrls,
      userData: {
        datasetStorage,
        firstSourceDomain,
        firstSourceUrl: logObject.url,
        linkType: LinkType.Image,
      },
    });

    await enqueueLinks({
      strategy: "all",
      label: "meta-src",
      urls: metaUrls,
      userData: {
        datasetStorage,
        firstSourceDomain,
        firstSourceUrl: logObject.url,
        linkType: LinkType.Meta,
      },
    });

    await enqueueLinks({
      label: "stylesheets-src",
      urls: stylesheetsUrls,
      userData: {
        datasetStorage,
        firstSourceDomain,
        firstSourceUrl: logObject.url,
        linkType: LinkType.Stylesheet,
      },
    });

    await enqueueLinks({
      label: "script-src",
      urls: scriptsUrls,
      userData: {
        datasetStorage,
        firstSourceDomain,
        firstSourceUrl: logObject.url,
        linkType: LinkType.Script,
      },
    });

    await enqueueLinks({
      strategy: "all",
      label: "documents-src",
      globs: ["**/*.docx", "**/*.pdf"],
      userData: {
        datasetStorage,
        firstSourceDomain,
        firstSourceUrl: logObject.url,
        linkType: LinkType.Link,
      },
    });

    await enqueueLinks({
      strategy: "all",
      label: recursiveCrawl ? "ahref-src" : "ahref-src-once",
      exclude: [/\.docx$/i, /\.pdf$/i, /\.zip$/i],
      userData: {
        datasetStorage,
        firstSourceDomain,
        firstSourceUrl: logObject.url,
        linkType: LinkType.Link,
      },
    });
  }
};

/**
 * Get crawl information from the URL
 * @param startUrl (string) - start url
 * @returns { domain: string | null, datasetStorage: string }
 */
export const getCrawlInfo = (startUrl: string) => {
  const currentTime = new Date().getTime();
  const domain = getDomainFromURL(startUrl);
  const datasetStorage = `${domain}-${currentTime}`;

  return { domain, datasetStorage };
};

/**
 * Crawl url, not recursively finding other links on the UI
 * @param startUrl (string) - start url to be crawled
 * @param domain (string | null) - domain
 * @param datasetStorage (string) - storage name
 * @param proxyConfiguration (ProxyConfiguration | undefined)
 * @param recursiveCrawl (boolean) - recursively crawling enabled or not, default to false
 */
export const crawlUrl = async (
  startUrl: string,
  domain: string | null,
  datasetStorage: string,
  proxyConfiguration: ProxyConfiguration | undefined,
  recursiveCrawl = false
) => {
  const store = await KeyValueStore.open(datasetStorage);

  const request: RequestOptions<Dictionary> = {
    url: startUrl,
    label: "ahref-src",
    userData: {
      datasetStorage,
      firstSourceDomain: domain,
      firstSourceUrl: startUrl,
      recursiveCrawl,
      linkType: LinkType.StartUrl,
    },
  };

  if (domain !== null) {
    // Purge the request queue folder before crawling
    const requestQueue = await RequestQueue.open();
    await requestQueue.drop();

    crawler = new PlaywrightCrawler({
      proxyConfiguration,
      requestHandler: router,
      failedRequestHandler: failedRouter,
      minConcurrency: 10,
      maxConcurrency: 15,
      maxRequestsPerMinute: 200,
      maxRequestRetries: 0, // Just to ignore 403 issue for now
      sessionPoolOptions: {
        persistStateKeyValueStoreId: datasetStorage,
      },
      useSessionPool: true,
      launchContext: {
        launcher: chromium,
      },
    });

    await crawler.run([request]);

    // Export crawl info to csv
    try {
      const dataset = await Dataset.open(datasetStorage);
      const data = await dataset.getData();
      if (data.items.length > 0) {
        await store.setValue("OUTPUT", data.items);
        await dataset.exportToCSV(datasetStorage, {
          toKVS: datasetStorage,
        });
      } else {
        console.log(`No crawl requests for dataset ${datasetStorage}.`);
      }
    } catch (e) {
      console.log(e);
      console.log(`Error exporting ${datasetStorage}.csv file!`);
    }

    console.log("Crawler finished.");
    // Remove crawler
    crawler = undefined;
  } else {
    console.log("Domain is not valid, please enter a correct URL format");
  }
};
