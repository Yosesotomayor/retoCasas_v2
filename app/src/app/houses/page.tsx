import HouseElement from "@/components/HouseElement";
import Link from "next/link";

interface House {
  id: number;
  title: string;
  description: string;
  image: string;
}

export default async function Houses() {
  let houses: House[] = [];
  
  try {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/houses`, {
      cache: 'no-store'
    });
    
    if (res.ok) {
      houses = await res.json();
    }
  } catch (error) {
    console.error('Error fetching houses:', error);
  }

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