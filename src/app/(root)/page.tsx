"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    window.location.replace("/uk/");
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
          Український Verein
        </p>
        <h1 className="mt-3 text-3xl font-bold text-blue-strong">
          Відкриваємо українську версію
        </h1>
        <Link
          href="/uk/"
          className="focus-ring mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-blue-strong px-5 py-2.5 text-sm font-semibold text-white"
        >
          Перейти на сайт
        </Link>
      </div>
    </main>
  );
}
