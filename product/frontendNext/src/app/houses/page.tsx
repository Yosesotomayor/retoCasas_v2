"use client";
import { useRouter } from "next/navigation";

export default function HousesList() {
    const router = useRouter();

    return(
        <div>
            <h1>Houses List</h1>
            <h2 onClick={() => {
            router.push("/houses/1");
          }}
            >House 1</h2>

            <h2 onClick={() => {
            router.push("/houses/2");
          }}
            >House 2</h2>
            <h2 onClick={() => {
            router.push("/houses/3");
          }}
            >House 3</h2>
        </div>
    )
}