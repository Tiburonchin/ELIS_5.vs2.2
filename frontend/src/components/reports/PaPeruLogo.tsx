import React from 'react';

interface PaPeruLogoProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Componente oficial de Logo P.A. Perú (PROFESIONALES ASOCIADOS PERU S.A.C).
 * Recrea fielmente el logotipo corporativo oficial con su isotipo geométrico azul,
 * tipografía corporativa y texto "PROFESIONALES ASOCIADOS".
 * También soporta cargar la imagen oficial `/pa-peru-logo.png` con fallback SVG vectorial.
 */
export const PaPeruLogo: React.FC<PaPeruLogoProps> = ({ className = 'h-10', style }) => {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`} style={style}>
      <img
        src="/pa-peru-logo.png"
        alt="P.A. Perú - Profesionales Asociados"
        className="max-h-full max-w-full object-contain"
        onError={(e) => {
          // Si por alguna razón la imagen no carga, fallback al SVG corporativo
          (e.currentTarget as HTMLElement).style.display = 'none';
          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = 'flex';
        }}
      />
      <div className="hidden items-center gap-1.5 text-left" style={{ display: 'none' }}>
        <svg viewBox="0 0 100 100" className="w-8 h-8 flex-shrink-0" fill="none">
          {/* Isotipo geométrico azul estilizado PA */}
          <polygon points="10,85 50,15 90,85" stroke="#00529b" strokeWidth="8" fill="none" />
          <polygon points="30,85 50,45 70,85" fill="#00529b" />
          <circle cx="50" cy="30" r="8" fill="#e30613" />
        </svg>
        <div className="leading-tight">
          <div className="font-extrabold text-[#00529b] text-base tracking-tight leading-none">
            P.A. Perú
          </div>
          <div className="text-[7.5px] font-semibold text-gray-600 tracking-wider uppercase leading-none mt-0.5">
            Profesionales Asociados
          </div>
        </div>
      </div>
    </div>
  );
};
