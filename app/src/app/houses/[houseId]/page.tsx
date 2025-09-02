import Image from "next/image";
import Link from "next/link";

interface House {
  id: number;
  title: string;
  price: number;
  image: string;
}

interface HouseDetailsProps {
  params: Promise<{ houseId: string }>;
}

export default async function HouseDetails({ params }: HouseDetailsProps) {
  const { houseId } = await params;
  const res = await fetch(`http://localhost:3000/data/houses.json`);
  const data = await res.json();
  const houses: House[] = Array.isArray(data) ? data : data.houses || [];
  const house = houses.find((h) => h.id === parseInt(houseId));

  if (!house) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Casa no encontrada</h1>
        <Link href="/houses" className="text-blue-500 hover:underline">
          Volver a la lista
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link 
        href="/houses" 
        className="text-blue-500 hover:underline mb-4 inline-block"
      >
        ← Volver a la lista
      </Link>
      
      <h1 className="text-3xl font-bold mb-6">{house.title}</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <Image
            src={house.image}
            alt={house.title}
            className="w-full h-auto rounded-lg shadow-lg"
            width={500}
            height={400}
          />
        </div>
        
        <div>
          <p className="text-2xl font-semibold text-green-600 mb-4">
            ${house.price.toLocaleString()}
          </p>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Detalles de la propiedad</h2>
            <p>ID: {house.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}