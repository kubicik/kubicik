import Image from "next/image"
import type { TripPhoto } from "@/types"

export default function TripDronePhotos({ photos }: { photos: TripPhoto[] }) {
  if (!photos.length) return null

  return (
    <section className="max-w-3xl mx-auto px-6 py-10">
      <h2 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight mb-6">
        Nejlepší záběry z dronu
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#e5e5ea]"
          >
            <Image
              src={photo.url}
              alt={photo.caption ?? "Dronový záběr"}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
            {photo.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                <p className="text-white text-xs leading-snug">{photo.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
