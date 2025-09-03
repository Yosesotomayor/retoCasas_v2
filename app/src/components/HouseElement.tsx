import Image from "next/image";

interface HouseElementProps {
  title: string;
  description: string;
  imageUrl?: string;
}

export default function HouseElement({ title, imageUrl }: HouseElementProps) {
  return (
    <div className="p-4 border border-gray-200 hover:shadow-lg transition-shadow rounded-md">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={title}
          className="object-cover rounded-md min-w-full min-h-full"
          width={300}
          height={200}
        />
      )}
    </div>
  );
}
