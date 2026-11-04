// Resize one photo for the web, applying its rotation and dropping all metadata (GPS, camera, etc.).
// Usage: photo <input> <out-full.jpg> <out-thumb.jpg> <fullMaxPx> <thumbMaxPx>
// Prints: <width> <height> <taken "YYYY:MM:DD HH:MM:SS" or "-">
import Foundation
import ImageIO
import UniformTypeIdentifiers

let a = CommandLine.arguments
guard a.count == 6, let fullMax = Int(a[4]), let thumbMax = Int(a[5]) else {
  FileHandle.standardError.write("usage: photo in full.jpg thumb.jpg fullMax thumbMax\n".data(using: .utf8)!); exit(2)
}
guard let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: a[1]) as CFURL, nil) else {
  FileHandle.standardError.write("cannot read \(a[1])\n".data(using: .utf8)!); exit(1)
}
let props = CGImageSourceCopyPropertiesAtIndex(src, 0, nil) as? [CFString: Any] ?? [:]
let exif = props[kCGImagePropertyExifDictionary] as? [CFString: Any] ?? [:]
let tiff = props[kCGImagePropertyTIFFDictionary] as? [CFString: Any] ?? [:]
let taken = (exif[kCGImagePropertyExifDateTimeOriginal] as? String) ?? (tiff[kCGImagePropertyTIFFDateTime] as? String) ?? "-"

func render(_ maxPx: Int, _ out: String, _ q: Double) -> CGImage {
  let opts: [CFString: Any] = [
    kCGImageSourceCreateThumbnailFromImageAlways: true,
    kCGImageSourceCreateThumbnailWithTransform: true,   // bake in EXIF orientation
    kCGImageSourceThumbnailMaxPixelSize: maxPx,
  ]
  guard let img = CGImageSourceCreateThumbnailAtIndex(src, 0, opts as CFDictionary),
        let dst = CGImageDestinationCreateWithURL(URL(fileURLWithPath: out) as CFURL, UTType.jpeg.identifier as CFString, 1, nil)
  else { FileHandle.standardError.write("cannot convert \(a[1])\n".data(using: .utf8)!); exit(1) }
  // Only the compression quality is written: no EXIF, GPS or maker notes.
  CGImageDestinationAddImage(dst, img, [kCGImageDestinationLossyCompressionQuality: q] as CFDictionary)
  guard CGImageDestinationFinalize(dst) else { exit(1) }
  return img
}
let full = render(fullMax, a[2], 0.8)
_ = render(thumbMax, a[3], 0.72)
print("\(full.width) \(full.height) \(taken)")
