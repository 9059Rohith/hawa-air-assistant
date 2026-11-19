import Link from "next/link";
export default function NotFound() {
  return (
    <section className="hero">
      <h1>This page drifted away.</h1>
      <p>Let’s return to your clean-air plan.</p>
      <Link className="primary" href="/">
        Back to HAWA
      </Link>
    </section>
  );
}
