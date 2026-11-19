"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="hero">
      <h1>Something interrupted this page.</h1>
      <p>
        Your browser may still have your saved profile. Try loading the page
        again.
      </p>
      <button onClick={reset}>Retry</button>
    </section>
  );
}
