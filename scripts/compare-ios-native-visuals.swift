import CoreGraphics
import Foundation
import ImageIO

struct ComparisonResult {
    let differingPixels: Int
    let totalPixels: Int
    let maximumChannelDelta: UInt8
}

func loadImage(_ path: String) -> CGImage? {
    let url = URL(fileURLWithPath: path)
    guard let source = CGImageSourceCreateWithURL(url as CFURL, nil) else { return nil }
    return CGImageSourceCreateImageAtIndex(source, 0, nil)
}

func compare(_ baselinePath: String, _ actualPath: String) -> ComparisonResult? {
    guard let baseline = loadImage(baselinePath), let actual = loadImage(actualPath),
          baseline.width == actual.width, baseline.height == actual.height,
          baseline.bitsPerComponent == actual.bitsPerComponent,
          baseline.bitsPerPixel == actual.bitsPerPixel,
          let baselineData = baseline.dataProvider?.data as Data?,
          let actualData = actual.dataProvider?.data as Data? else { return nil }

    let bytesPerPixel = baseline.bitsPerPixel / 8
    guard bytesPerPixel >= 3, baselineData.count == actualData.count else { return nil }

    let tolerance: UInt8 = 3
    var differingPixels = 0
    var maximumChannelDelta: UInt8 = 0
    baselineData.withUnsafeBytes { baselineBytes in
        actualData.withUnsafeBytes { actualBytes in
            for offset in stride(from: 0, to: baselineData.count, by: bytesPerPixel) {
                var pixelDiffers = false
                for channel in 0..<3 {
                    let baselineValue = baselineBytes[offset + channel]
                    let actualValue = actualBytes[offset + channel]
                    let delta = baselineValue >= actualValue ? baselineValue - actualValue : actualValue - baselineValue
                    maximumChannelDelta = max(maximumChannelDelta, delta)
                    if delta > tolerance { pixelDiffers = true }
                }
                if pixelDiffers { differingPixels += 1 }
            }
        }
    }

    return ComparisonResult(
        differingPixels: differingPixels,
        totalPixels: baseline.width * baseline.height,
        maximumChannelDelta: maximumChannelDelta
    )
}

let arguments = CommandLine.arguments
guard arguments.count == 3 else {
    fputs("usage: compare-ios-native-visuals.swift <baseline-directory> <actual-directory>\n", stderr)
    exit(2)
}

let baselineDirectory = arguments[1]
let actualDirectory = arguments[2]
let fileManager = FileManager.default
let baselineFiles = (try? fileManager.contentsOfDirectory(atPath: baselineDirectory))?.filter { $0.hasSuffix(".png") }.sorted() ?? []
guard !baselineFiles.isEmpty else {
    fputs("No native visual baselines found in \(baselineDirectory).\n", stderr)
    exit(2)
}

var failed = false
for file in baselineFiles {
    let baselinePath = URL(fileURLWithPath: baselineDirectory).appendingPathComponent(file).path
    let actualPath = URL(fileURLWithPath: actualDirectory).appendingPathComponent(file).path
    guard fileManager.fileExists(atPath: actualPath), let result = compare(baselinePath, actualPath) else {
        fputs("Missing or incompatible native visual: \(file)\n", stderr)
        failed = true
        continue
    }

    let mismatchRatio = Double(result.differingPixels) / Double(result.totalPixels)
    if mismatchRatio > 0.002 {
        fputs("Native visual mismatch \(file): \(result.differingPixels)/\(result.totalPixels) pixels, max channel delta \(result.maximumChannelDelta).\n", stderr)
        failed = true
    } else {
        print("Native visual passed \(file): \(result.differingPixels)/\(result.totalPixels) pixels within tolerance.")
    }
}

if failed {
    fputs("Native visual certification failed. Baselines are never updated automatically.\n", stderr)
    exit(1)
}
