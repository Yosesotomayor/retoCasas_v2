import Image from "next/image";

interface HouseElementProps {
  title: string;
  description: string;
  imageUrl?: string;
}

export default function HouseElement({ title, imageUrl }: HouseElementProps) {
  return (
    <div className="p-4 border border-gray-200 hover:shadow-lg transition-shadow rounded-md w-full sm:w-[25rem]">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      {imageUrl && (
        <div className="w-full h-[16rem] relative">
          <Image
            src={imageUrl}
            alt={title}
            className="object-cover rounded-md absolute w-full h-full"
            fill
          />
        </div>
      )}
    </div>
  );
}
