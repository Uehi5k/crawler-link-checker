import { Dictionary, LoadedRequest, Log, Request } from "crawlee";
import { Page } from "playwright";
import psl from "psl";
import { Direction, LinkStatus, LinkType, PageLog } from "../types/page.model.js";

/**
 * Create a log object
 * @param request (LoadedRequest<Request<Dictionary>>)
 * @param response (Dictionary | undefined)
 * @param page (Page)
 * @param log (Log)
 * @param type (LinkType)
 * @param firstSourceUrl (string)
 * @returns (Promise<PageLog>)
 */
export const createLogObject = async (
  request: LoadedRequest<Request<Dictionary>>,
  response: Dictionary | undefined,
  page: Page,
  log: Log,
  linkType: LinkType,
  firstSourceUrl: string
): Promise<PageLog> => {
  const url = request.url ?? request.loadedUrl;
  const destinationUrl = page.url();
  let title = "";
  try {
    title = page ? await page.title() : url;
  } catch (err) {
    title = url;
  }
  const contentType = page ? await response?.headerValue("content-type") : "Unknown";
  let status = response ? response?.status() : 500;

  log.info(`${title} - Type ${linkType} - Status ${status}`, { url });

  return {
    url,
    destinationUrl,
    title,
    status,
    brokenCheck: status >= 200 && status < 300 ? LinkStatus.Ok : LinkStatus.Error,
    linkType,
    contentType,
    firstSourceUrl,
    direction: Direction.Internal, // Set default to Internal
  };
};

/**
 * Get domain from a provided URL
 * @param url (string) - provided url
 * @returns (string | null)
 */
export const getDomainFromURL = (url: string): string | null => {
  let domain = null;
  try {
    const urlObject = new URL(url);
    domain = psl.get(urlObject.hostname);
  } catch (err) {}

  return domain;
};

/**
 * Get link type from media content
 * @param contentType (string)
 * @returns (LinkType)
 */
export const getLinkTypeFromMediaContent = (contentType: string): LinkType => {
  if (contentType.startsWith("image")) {
    return LinkType.Image;
  }

  return LinkType.Link;
};
