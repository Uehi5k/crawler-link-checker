import { Elysia } from "elysia";
import { node } from "@elysiajs/node";
import { swagger } from "@elysiajs/swagger";
import { crawl } from "./elysia-routes/crawl.js";
import { publicWeb } from "./elysia-routes/public.js";

const app = new Elysia({ adapter: node() })
  .use(swagger())
  .use(crawl)
  .use(publicWeb)
  .listen(3000, ({ hostname, port }) => {
    console.log(`🦊 Elysia is running at ${hostname}:${port}`);
  });
