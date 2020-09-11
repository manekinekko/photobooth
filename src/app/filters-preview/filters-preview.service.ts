import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class FiltersPreviewService {
  constructor() {}

  getFilters() {
    return [
      { label: "Normal", filters: [{ id: "noop" }] },

      // presets
      { label: "ASCII", filters: [{ id: "ascii" }] },
      { label: "BGR", filters: [{ id: "bgr" }] },
      { label: "Blur Hor.", filters: [{ id: "blurHorizontal", args: [20] }] },
      { label: "Blur Ver.", filters: [{ id: "blurVertical", args: [20] }] },
      { label: "Blur", filters: [{ id: "blur", args: [20] }] },
      { label: "Brightness", filters: [{ id: "brightness", args: [1.5] }] },
      { label: "Brownie", filters: [{ id: "brownie" }] },
      { label: "Chroma Key", filters: [{ id: "chromaKey" }] },
      { label: "Contrast", filters: [{ id: "contrast", args: [1.5] }] },
      { label: "CRT", filters: [{ id: "crt", args: [] }] },
      { label: "Edges", filters: [{ id: "edges" }] },
      { label: "Emboss", filters: [{ id: "emboss" }] },
      { label: "Grayscal 1", filters: [{ id: "desaturateLuminance" }] },
      { label: "Grayscal 2", filters: [{ id: "desaturate" }] },
      { label: "Hue", filters: [{ id: "hue", args: [180] }] },
      { label: "Koda", filters: [{ id: "kodachrome" }] },
      { label: "Negative", filters: [{ id: "negative" }] },
      { label: "Pixelate", filters: [{ id: "pixelate", args: [10] }] },
      { label: "Polaroid", filters: [{ id: "polaroid" }] },
      { label: "Saturate", filters: [{ id: "saturate", args: [1.5] }] },
      { label: "Sepia", filters: [{ id: "sepia", args: [1] }] },
      { label: "Sharpen", filters: [{ id: "sharpen" }] },
      { label: "Sobel Hor.", filters: [{ id: "sobelHorizontal" }] },
      { label: "Sobel Ver.", filters: [{ id: "sobelVertical" }] },
      { label: "Technicolor", filters: [{ id: "technicolor" }] },
      { label: "Vignette", filters: [{ id: "vignette" }] },
      { label: "Vintage", filters: [{ id: "vintagePinhole" }] },
      // instagram-like filters
      {
        label: "Clarendon",
        filters: [
          {
            id: "brightness",
            args: [1.1],
          },
          {
            id: "contrast",
            args: [1.5],
          },
          {
            id: "saturate",
            args: [1],
          },
        ],
      },
      {
        label: "Gingham",
        filters: [
          {
            id: "sepia",
            args: [0.5],
          },
          {
            id: "contrast",
            args: [0.9],
          },
        ],
      },
      {
        label: "Moon",
        filters: [
          {
            id: "desaturateLuminance",
            args: [],
          },
          {
            id: "contrast",
            args: [0.6],
          },
          {
            id: "brightness",
            args: [1.2],
          },
        ],
      },
    ];
  }
}
