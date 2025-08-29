
export default async function HouseDetails({params}:{
    params: Promise<{houseId: string}>;
}) {
    const houseId = (await params).houseId;
    const res = await fetch(`http://localhost:3000/data/houses.json`);
    const houses = await res.json();
    const house = houses.houses.find((house: {id: number}) => house.id === parseInt(houseId));

    // {
//     "houses": [
//         {
//             "id": 1,
//             "title": "Casa en el centro",
//             "price": 250000,
//             "image": "/images/houses/house1.png"
//         },
//         {
//             "id": 2,
//             "title": "Departamento en la playa",
//             "price": 300000,
//             "image": "/images/houses/house2.png"
//         },
//         {
//             "id": 3,
//             "title": "Casa de campo",
//             "price": 200000,
//             "image": "/images/houses/house3.png"
//         }
//     ]
// }

    return(
        <div>
            <h1 className="ml-5">House {houseId} Details</h1>
            <img 
                src={house?.image} 
                alt={`House ${houseId}`} 
                className="h-auto max-w-[30vw] object-contain ml-5" 
            />
            
        </div>
    )
}