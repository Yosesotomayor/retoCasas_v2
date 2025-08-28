
export default async function HouseDetails({params}:{params: Promise<{houseId: string}>;}) {
    const houseId = (await params).houseId;
    return(
        <div>
            <h1>House {houseId} Details</h1>
        </div>
    )
}