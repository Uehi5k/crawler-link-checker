import { LoadedRequest, Dictionary, Log, Dataset, Request } from "crawlee";
import { Page } from "playwright";
import { prepareLogData } from "../services/crawl.service.js";

/**
 * Run log process
 * @param request (LoadedRequest<Request<Dictionary>>)
 * @param response (Dictionary | undefined)
 * @param page (Page)
 * @param log (Log)
 * @param pushData (createPlaywrightRouter.pushData)
 */
export const runLogProcess = async (
  request: LoadedRequest<Request<Dictionary>>,
  response: Dictionary | undefined,
  page: Page,
  log: Log,
  pushData: (data: Readonly<Parameters<Dataset["pushData"]>[0]>, datasetIdOrName?: string) => Promise<void>
) => {
  const { datasetStorage, logObject } = await prepareLogData(request, response, page, log);

  await pushData(logObject, datasetStorage);
};
