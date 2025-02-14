import { Elysia, file } from "elysia";

export const publicWeb = new Elysia()
  .get("/", () => file(`./public/index.html`))
  .get("/results", () => file(`./public/results.html`));
