import type { Metadata } from "next";
import ForumClient from "./ForumClient";

export const metadata: Metadata = {
  title: "Forum d'entraide",
  description:
    "Le forum EduConnect : les élèves posent leurs questions, les instructeurs et les autres élèves y répondent. Maths, français, physique, SVT…",
};

export default function Page() {
  return <ForumClient />;
}
