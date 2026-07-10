"use server";

import React from "react";
import PageClient from "./PageClient";
import { listerCatalogueRubriques } from "../salaries/actions";

export default async function Page() {
  const catalogue = await listerCatalogueRubriques();
  return <PageClient catalogue={catalogue} />;
}
