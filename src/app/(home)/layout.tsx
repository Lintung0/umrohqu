import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import CompareFloatingBar from "@/components/shared/compare-floating-bar";
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div>{children}</div>
      <Footer />
      <CompareFloatingBar />
    </>
  );
}
