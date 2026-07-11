import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

/**
 * Marketing chrome (sticky nav + footer) — scoped to the public site only via
 * this route group, so /login and /dashboard get their own minimal headers
 * instead of the full marketing nav/footer.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
