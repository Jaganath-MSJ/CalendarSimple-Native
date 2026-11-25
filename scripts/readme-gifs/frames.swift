// Extracts PNG frames from a video with AVFoundation (no ffmpeg needed).
//
//   xcrun swift frames.swift <video> <out-dir> <fps> <width> [<start-s>] [<end-s>]
//
// Frames are named 0000.png, 0001.png, … and scaled to <width> pixels wide.
import AVFoundation
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
guard args.count >= 5, let fps = Double(args[3]), let width = Double(args[4])
else {
  FileHandle.standardError.write(
    "usage: frames.swift <video> <out-dir> <fps> <width> [start] [end]\n".data(using: .utf8)!)
  exit(2)
}
let asset = AVURLAsset(url: URL(fileURLWithPath: args[1]))
let outDir = URL(fileURLWithPath: args[2], isDirectory: true)
try FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)

let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero
generator.maximumSize = CGSize(width: width, height: 100_000)

let duration = CMTimeGetSeconds(asset.duration)
let start = args.count > 5 ? Double(args[5]) ?? 0 : 0
let end = min(args.count > 6 ? Double(args[6]) ?? duration : duration, duration)

var index = 0
var t = start
while t < end {
  let time = CMTime(seconds: t, preferredTimescale: 600)
  let image = try generator.copyCGImage(at: time, actualTime: nil)
  let file = outDir.appendingPathComponent(String(format: "%04d.png", index))
  guard
    let dest = CGImageDestinationCreateWithURL(
      file as CFURL, UTType.png.identifier as CFString, 1, nil)
  else { exit(1) }
  CGImageDestinationAddImage(dest, image, nil)
  CGImageDestinationFinalize(dest)
  index += 1
  t += 1 / fps
}
print("\(index) frames, \(String(format: "%.1f", end - start)) s")
