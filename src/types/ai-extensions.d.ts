import { UIMessage } from "ai";

declare module "ai" {
  interface UIMessagePart {
    type: UIMessage["parts"][number]["type"] | "image";
    image?: string;
  }
}

export {};
