import { Elysia, error, file, t } from "elysia";
import { crawlUrl, crawler, getCrawlInfo } from "../services/crawl.service.js";
import { getResults } from "../services/results.service.js";
import { existsSync } from "fs";
class Crawler {
  // TODO - to improve this and have another route to request for progress
  crawl(url: string) {
    const { domain, datasetStorage } = getCrawlInfo(url);
    if (domain === null) {
      return error(400, {
        error: "URL is not correct, please try a different domain!",
      });
    }

    if (crawler !== undefined) {
      return error(503, {
        error:
          "Crawler is currently performing for a user, please try again later!",
      });
    }

    crawlUrl(url, domain, datasetStorage, undefined, false);
    return { key: datasetStorage };
  }

  getResults(key: string) {
    return getResults(key);
  }
}

export const crawl = new Elysia({ prefix: "/crawl" })
  .decorate("crawler", new Crawler())
  .post(
    "/",
    ({ crawler, body: { url } }) => {
      return crawler.crawl(url);
    },
    {
      body: t.Object({
        url: t.String(),
      }),
    }
  )
  .get("results/:id", ({ params: { id }, crawler }) => crawler.getResults(id))
  .get("results/download/:id", ({ params: { id } }) => {
    try {
      const path = `./storage/key_value_stores/${id}/${id}.csv`;
      const fileExist = existsSync(path);
      if (!fileExist) {
        return error(404, { error: "File not found" });
      }

      const resultFile = file(path);
      return resultFile;
    } catch {
      return error(404, { error: "File not found" });
    }
  });
