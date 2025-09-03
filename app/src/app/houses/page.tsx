import HouseElement from "@/components/HouseElement";
import Link from "next/link";

interface House {
  id: number;
  title: string;
  description: string;
  image: string;
}

export default async function Houses() {
  const res = await fetch(`http://localhost:3000/data/houses.json`);
  const data = await res.json();
  const houses: House[] = Array.isArray(data) ? data : data.houses || [];

  return (
    <div className="mx-auto px-4 py-8 flex flex-col overflow-auto h-full">
      <h1 className="text-3xl font-bold mb-6">Lista de Casas</h1>
      <div className="flex flex-wrap gap-5 justify-center">
        {houses.map((house) => (
          <Link 
            key={house.id} 
            href={`/houses/${house.id}`} 
            className="block w-full sm:w-auto"
          >
            <HouseElement
              title={house.title}
              description={house.description}
              imageUrl={house.image}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}