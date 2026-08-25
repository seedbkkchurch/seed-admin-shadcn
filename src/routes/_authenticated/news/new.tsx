import { createFileRoute, redirect } from "@tanstack/react-router";
import { checkCanWriteNews } from "@/features/news/data/queries";
import { NewsEditor } from "@/features/news/news-editor";

export const Route = createFileRoute("/_authenticated/news/new")({
  beforeLoad: async () => {
    const canWrite = await checkCanWriteNews();
    if (!canWrite) {
      throw redirect({ to: "/403" });
    }
  },
  component: NewsEditor,
});
