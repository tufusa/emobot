import {
  APIInteraction,
  APIInteractionResponseChannelMessageWithSource,
  APIInteractionResponsePong,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
} from "discord-api-types/v10";
import { Hono } from "hono";
import { StatusCode } from "hono/utils/http-status";
import commands from "./assets/commands.json";
import { verifyKeyMiddleware } from "./middleware/verifyKeyMiddleware";

export type Bindings = {
  BOT_TOKEN: string;
  BOT_PUBLIC_KEY: string;
  BOT_APPLICATION_ID: string;
  BOT_EMOJI_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

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
  } else if (
    interaction.type == InteractionType.ApplicationCommand &&
    interaction.data.type == ApplicationCommandType.ChatInput &&
    interaction.data.name == commands.name &&
    interaction.data.options?.[0].type == ApplicationCommandOptionType.String &&
    interaction.data.options?.[0].name == commands.options[0].name
  ) {
    const emojiName = interaction.data.options[0].value;
    const response = await fetch(`${c.env.BOT_EMOJI_URL}?name=${emojiName}`);
    const json = (await response.json()) as { url?: string };
    if (!response.ok || !json.url) {
      return c.json<APIInteractionResponseChannelMessageWithSource>({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: `No emoji named "${emojiName}" found.`,
          flags: MessageFlags.Ephemeral,
        },
      });
    }

    return c.json<APIInteractionResponseChannelMessageWithSource>({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: json.url,
      },
    });
  }
});

app.post("/register/:guildId", async (c) => {
  const guildId = c.req.param("guildId");
  const response = await fetch(
    `https://discord.com/api/v10/applications/${c.env.BOT_APPLICATION_ID}/guilds/${guildId}/commands`,
    {
      method: "POST",
      body: JSON.stringify(commands),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${c.env.BOT_TOKEN}`,
      },
    }
  );

  return c.json(
    { response: await response.json() },
    response.status as StatusCode
  );
});

export default app;
