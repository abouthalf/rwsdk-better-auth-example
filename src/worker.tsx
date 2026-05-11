import { render, route, prefix } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { AppPage } from "@/app/pages/app";
import { ProfilePage } from "@/app/pages/profile";
import { auth } from "@/lib/auth";

export type AppContext = Record<string, never>;

export default defineApp([
  setCommonHeaders(),
  prefix("/api/auth", [
    route("/*", ({ request }) => auth.handler(request)),
  ]),
  render(Document, [
    route("/", Home),
    route("/app", AppPage),
    route("/profile", ProfilePage),
  ]),
]);
