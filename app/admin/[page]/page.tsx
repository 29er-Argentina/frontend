import type { Metadata } from "next";
import SectionPage from "@/components/admin/SectionPage";
import { ADMIN_PAGES } from "@/lib/admin-schema";

export const dynamicParams = false;

export function generateStaticParams() {
  return ADMIN_PAGES.map((p) => ({ page: p.slug }));
}

export async function generateMetadata(props: PageProps<"/admin/[page]">): Promise<Metadata> {
  const { page } = await props.params;
  return { title: ADMIN_PAGES.find((p) => p.slug === page)?.label ?? "Panel" };
}

export default async function AdminSectionPage(props: PageProps<"/admin/[page]">) {
  const { page } = await props.params;
  return <SectionPage slug={page} />;
}
