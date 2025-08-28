

export default function Topbar() {
    return (
      <div className="h-14 bg-[#2b2b2b] text-white flex items-center gap-3 px-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        {/* lista de significado de estilos
        h-14 es para definir height 14
        bg-[#2b2b2b] es para definir el color de fondo
        text-white es para definir el color del texto
        flex es para aplicar un contenedor flex
        items-center es para alinear los elementos en el centro verticalmente
        gap-3 es para definir un espacio entre los elementos
        px-5 es para aplicar un padding horizontal
        shadow-[0_4px_12px_rgba(0,0,0,0.08)] es para aplicar una sombra en el contenedor
        */}
        <div
          aria-hidden="true" // Esto oculta el elemento de la accesibilidad, se ignora en lectores de pantalla por que no es relevante
          className="w-7 h-7 rounded-[7px] bg-white"
          style={{
            WebkitMask: //Esto es para aplicar un icono SVG como máscara
              "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 fill=%22black%22 viewBox=%220 0 24 24%22><path d=%22M12 3 2 12h3v8h6v-5h2v5h6v-8h3L12 3z%22/></svg>') center / 20px no-repeat",
            mask: //esto es para aplicar un icono SVG como máscara
              "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 fill=%22black%22 viewBox=%220 0 24 24%22><path d=%22M12 3 2 12h3v8h6v-5h2v5h6v-8h3L12 3z%22/></svg>') center / 20px no-repeat",
          }}
        />
        
        <span className="font-semibold">Inicio</span>
      </div>
    )
}