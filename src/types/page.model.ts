export enum Direction {
  Internal = "Internal",
  Outbound = "Outbound",
}

export enum LinkType {
  Link = "AHref",
  Image = "ImgSrc",
  Stylesheet = "Stylesheet",
  Script = "ScriptSrc",
  CSS = "CSSSrc",
  Meta = "MetaTag",
  StartUrl = "StartUrl",
  Other = "Other",
}

export enum LinkStatus {
  Ok = "OK",
  Error = "Error",
}

export interface PageLog {
  url: string;
  destinationUrl: string;
  title: string;
  status: number;
  brokenCheck: LinkStatus;
  linkType: LinkType;
  contentType: string;
  firstSourceUrl: string;
  direction: Direction;
}
