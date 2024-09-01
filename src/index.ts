import { Hono } from "hono";
import { verifyKeyMiddleware } from "./middleware/verifyKeyMiddleware";
import {
  APIInteraction,
  APIInteractionResponsePong,
  InteractionResponseType,
  InteractionType,
} from "discord-api-types/v10";

export type Bindings = {
  BOT_TOKEN: string;
  BOT_PUBLIC_KEY: string;
  BOT_APPLICATION_ID: string;
};

const app = new Hono();

app.use("/interactions", verifyKeyMiddleware);

app.get("/", (c) => {
  return c.text("emobot is up");
});

app.post("/interactions", async (c) => {
  const interaction = await c.req.json<APIInteraction>();

  if (interaction.type == InteractionType.Ping) {
    return c.json<APIInteractionResponsePong>({
      type: InteractionResponseType.Pong,
    });
  }
});

export default app;
