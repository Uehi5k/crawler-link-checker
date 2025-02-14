import { createPlaywrightRouter } from "crawlee";
import { crawlPageAhrefSrc } from "../services/crawl.service.js";
import { runLogProcess } from "../helpers/log.js";

export const router = createPlaywrightRouter();

router.addHandler(
  "ahref-src",
  async ({ request, response, page, log, pushData, enqueueLinks }) => {
    await crawlPageAhrefSrc(
      request,
      response,
      page,
      log,
      pushData,
      enqueueLinks
    );
  }
);

router.addHandler(
  "ahref-src-once",
  async ({ request, response, page, log, pushData }) => {
    await runLogProcess(request, response, page, log, pushData);
  }
);

// Reason why I sepaerated the handler with same functions, just to make it easier to debug when crawling in each section
router.addHandler(
  "img-src",
  async ({ request, response, page, log, pushData }) => {
    await runLogProcess(request, response, page, log, pushData);
  }
);

// TODO - optimize this to run using gotScarping instead of waiting for it to return failed crawling
router.addHandler(
  "documents-src",
  async ({ request, response, page, log, pushData }) => {
    await runLogProcess(request, response, page, log, pushData);
  }
);

router.addHandler(
  "meta-src",
  async ({ request, response, page, log, pushData }) => {
    await runLogProcess(request, response, page, log, pushData);
  }
);

router.addHandler(
  "stylesheets-src",
  async ({ request, response, page, log, pushData }) => {
    await runLogProcess(request, response, page, log, pushData);
  }
);

router.addHandler(
  "script-src",
  async ({ request, response, page, log, pushData }) => {
    await runLogProcess(request, response, page, log, pushData);
  }
);
