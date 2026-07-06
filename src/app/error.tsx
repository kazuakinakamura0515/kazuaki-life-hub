"use client";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="state-page" role="alert"><div className="state-icon">!</div><h1>表示できませんでした</h1><p>通信状態を確認して、もう一度お試しください。</p><button className="btn primary" onClick={reset}>もう一度試す</button></main>;
}
