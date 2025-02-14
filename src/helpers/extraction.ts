import { Page } from "playwright";
import psl from "psl";
import { getDomainFromURL } from "./utils.js";

/**
 * Extract img src from Page object
 * @param page (Page) - playwright page, should be provided in the handler
 * @returns (Promise<string[]>)
 */
export const extractImgSrc = async (page: Page): Promise<string[]> => {
  return await page.evaluate(() => {
    const imgSrcs = Array.from(document.querySelectorAll("img")).map((img) => img.src);
    const imgSrcSets = Array.from(document.querySelectorAll("img"))
      .map((img) => {
        const srcsets = img.srcset.split(",");
        if (srcsets.length === 0) {
          return [];
        }

        return srcsets.filter((srcset) => srcset && srcset.length > 0).map((srcset) => srcset.split(" ")[0]);
      })
      .flat(1);
    return [...new Set(imgSrcs.concat(imgSrcSets))];
  });
};

/**
 * Extract meta content with urls only
 * @param page (Page) - playwright page, should be provided in the handler
 * @returns (Promise<string[]>)
 */
export const extractMetaContent = async (page: Page): Promise<string[]> => {
  const metaContents = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("meta")).map((meta) => meta.content);
  });

  return [
    ...new Set(
      metaContents.filter((metaContent) => {
        return psl.isValid(getDomainFromURL(metaContent) ?? "");
      })
    ),
  ];
};

/**
 * Extract stylesheets
 * @param page (Page) - playwright page, should be provided in the handler
 * @returns (Promise<string[]>)
 */
export const extractStyleSheetLinks = async (page: Page): Promise<string[]> => {
  const stylessheets = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("link")).map((stylesheet) => stylesheet.href);
  });

  return [...new Set(stylessheets)];
};

/**
 * Extract script srcs
 * @param page (Page) - playwright page, should be provided in the handler
 * @returns (Promise<string[]>)
 */
export const extractScriptSrcs = async (page: Page): Promise<string[]> => {
  const scripts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("script")).map((script) => script.src);
  });

  return [...new Set(scripts)];
};
