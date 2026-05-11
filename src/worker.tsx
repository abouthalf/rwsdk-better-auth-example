import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { AppPage } from "@/app/pages/app";
import { ProfilePage } from "@/app/pages/profile";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  render(Document, [
    route("/", Home),
    route("/app", AppPage),
    route("/profile", ProfilePage),
  ]),
]);
