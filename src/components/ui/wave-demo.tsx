"use client";

import {DitheringShader} from "@/components/ui/dithering-shader";

export default function DemoOne(){return <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden"><DitheringShader shape="wave" type="8x8" colorBack="#000000" colorFront="#ffffff" pxSize={3} speed={.6}/><span className="pointer-events-none absolute z-10 whitespace-pre-wrap text-center text-7xl font-semibold leading-none tracking-tighter text-white">Wave</span></div>}
