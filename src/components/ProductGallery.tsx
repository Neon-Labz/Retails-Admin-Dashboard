"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const gallery = images.length > 0 ? images : ["/images/products/placeholder.jpg"];
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-50">
        <Image src={gallery[active]} alt={name} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" priority />
      </div>
      {gallery.length > 1 && (
        <div className="mt-3 flex gap-2">
          {gallery.map((img, idx) => (
            <button
              key={img + idx}
              onClick={() => setActive(idx)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                active === idx ? "border-blue-900" : "border-transparent"
              }`}
            >
              <Image src={img} alt={`${name} ${idx + 1}`} fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
