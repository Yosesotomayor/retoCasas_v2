import HouseElement from "@/components/houseElement";
import Link from "next/link";

export default async function HousesList() {
    const res = await fetch(`http://localhost:3000/data/houses.json`);
    const data = await res.json();
    const houses = Array.isArray(data) ? data : data.houses || [];

    return(
        <div>
            <h1>Houses List</h1>

            {houses.map((house: { id: number; title: string; description: string; image: string }) => (
                <Link key={house.id} href={`/houses/${house.id}`} className="block mb-4">
                  <HouseElement key={house.id} params={{
                    title: house.title,
                    description: house.description,
                    imageUrl: house.image
                }} />
                </Link>
            ))}

        </div>
    )
}