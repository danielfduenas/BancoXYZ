// src/components/LogoXYZ.tsx
import React from "react";
import Svg, { G, Path, Text, TSpan } from "react-native-svg";

interface LogoXYZProps {
  width?: number | string;
  height?: number | string;
}

export default function LogoXYZ({ width = "100%", height = 80 }: LogoXYZProps) {
  return (
    <Svg viewBox="0 0 450 100" width={width} height={height}>
      {/* ISOTIPO: Tres bloques/flechas transaccionales entrelazadas */}
      <G transform="translate(10, 10)">
        {/* Flecha Izquierda (X) - Azul Claro */}
        <Path
          d="M 10 10 L 35 10 L 55 50 L 35 80 L 10 80 L 30 50 Z"
          fill="#a5c5f5"
        />
        {/* Flecha Central (Y) - Azul Corporativo */}
        <Path
          d="M 32 10 L 57 10 L 77 50 L 57 80 L 32 80 L 52 50 Z"
          fill="#0052cc"
        />
        {/* Flecha Derecha (Z) - Rojo / Egreso */}
        <Path
          d="M 54 10 L 79 10 L 99 50 L 79 80 L 54 80 L 74 50 Z"
          fill="#de350b"
        />
      </G>

      {/* LOGOTIPO: Texto tipográfico integrado de alta resolución */}
      <Text
        x="130"
        y="58"
        fontSize="34"
        fontWeight="900"
        fill="#1a1a1a"
        letterSpacing="1"
      >
        Banco<TSpan fill="#0052cc">XYZ</TSpan>
      </Text>

      {/* Slogan institucional inferior */}
      <Text
        x="132"
        y="78"
        fontSize="12"
        fontWeight="600"
        fill="#666"
        letterSpacing="2"
      >
        BANCA MÓVIL
      </Text>
    </Svg>
  );
}
