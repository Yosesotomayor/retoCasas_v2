import Image from "next/image";


type HouseElementProps = {
    params: {
        title: string;
        description: string;
        imageUrl?: string;
    };
};

export default function HouseElement ({params}: HouseElementProps) {
    return (
        <div>
            <h2>{params.title}</h2>
            <p>{params.description}</p>
            {params.imageUrl && (
                <Image
                    src={params.imageUrl}
                    alt={params.title}
                    className="h-auto max-w-[30vw] object-contain ml-5"
                    width={300}
                    height={200}
                />
            )}
        </div>
    );
}
