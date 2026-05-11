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
  route("/logout", async ({ request }) => {
    await auth.api.signOut({ headers: request.headers });
    return new Response(null, {
      status: 302,
      headers: { Location: "/" },
    });
  }),
  render(Document, [
    route("/", Home),
    route("/app", [
      async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          return new Response(null, { status: 302, headers: { Location: "/" } });
        }
      },
      AppPage,
    ]),
    route("/profile", [
      async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          return new Response(null, { status: 302, headers: { Location: "/" } });
        }
      },
      ProfilePage,
    ]),
  ]),
]);
