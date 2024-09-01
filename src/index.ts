import { Hono } from "hono";

export type Bindings = {
  BOT_TOKEN: string;
  BOT_PUBLIC_KEY: string;
  BOT_APPLICATION_ID: string;
};

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default app;
