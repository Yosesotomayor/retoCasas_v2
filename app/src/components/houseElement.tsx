import Image from "next/image";

interface HouseElementProps {
  title: string;
  description: string;
  imageUrl?: string;
}

export default function HouseElement({ title, description, imageUrl }: HouseElementProps) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg shadow hover:shadow-lg transition-shadow">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-600 mb-3">{description}</p>
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={title}
          className="h-auto max-w-full object-cover rounded-md"
          width={300}
          height={200}
        />
      )}
    </div>
  );
}
