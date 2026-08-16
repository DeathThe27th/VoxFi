"use client";

import {Dithering} from "@paper-design/shaders-react";

type Props={shape?:"simplex"|"warp"|"dots"|"wave"|"ripple"|"swirl"|"sphere";type?:"random"|"2x2"|"4x4"|"8x8";colorBack?:string;colorFront?:string;pxSize?:number;speed?:number;className?:string};

export function DitheringShader({shape="wave",type="8x8",colorBack="#001122",colorFront="#ff0088",pxSize=3,speed=.6,className}:Props){
  return <Dithering shape={shape} type={type} colorBack={colorBack} colorFront={colorFront} size={pxSize} speed={speed} className={className} style={{position:"absolute",inset:0,width:"100%",height:"100%"}}/>;
}
