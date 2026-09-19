import type { Metadata } from "next";
import SuggestionsClient from "./SuggestionsClient";

export const metadata: Metadata = {
  title: "Suggestions",
  description: "Partagez vos idées et retours pour améliorer EduConnect.",
};

export default function Page() {
  return <SuggestionsClient />;
}
