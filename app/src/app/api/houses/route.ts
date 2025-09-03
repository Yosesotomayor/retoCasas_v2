import { NextResponse } from 'next/server';

export async function GET() {
  const mockHouses = [
    {
      id: 1,
      title: "Casa Moderna",
      description: "Hermosa casa moderna con 3 habitaciones",
      image: "/images/houses/house1.png"
    },
    {
      id: 2,
      title: "Casa Colonial",
      description: "Clásica casa colonial con jardín amplio", 
      image: "/images/houses/house2.png"
    },
    {
      id: 3,
      title: "Casa Familiar",
      description: "Amplia casa familiar con espacios abiertos",
      image: "/images/houses/house3.png"
    }
  ];
  
  return NextResponse.json(mockHouses);
}