import type { Metadata } from "next";
import PanelProvider from "@/components/admin/PanelProvider";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel 29er" },
  robots: { index: false, follow: false },
  referrer: "same-origin",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <PanelProvider>{children}</PanelProvider>;
}
