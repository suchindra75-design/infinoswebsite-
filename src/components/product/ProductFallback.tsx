/* eslint-disable @next/next/no-img-element */
export function ProductFallback({ reason = 'WEBGL UNAVAILABLE' }: { reason?: string }) {
  return (
    <div className="product-fallback" role="img" aria-label="INFINOS Pro Dual-Chamber Bag, static image">
      <img src="/images/hero-fallback.jpg" alt="" width={560} height={700} style={{ maxHeight: '70vh', width: 'auto', borderRadius: 6 }} />
      <p className="product-fallback-note">STATIC RENDER — {reason}</p>
    </div>
  )
}
