import prisma from "../src/db";

// Define serverID (you might want to import this from a config file)
const serverID = 1; // Replace with your actual serverID

async function main() {
  try {
    // Check if the record already exists
    const existingRecord = await prisma.replicacheServer.findUnique({
      where: { id: serverID },
    });

    if (!existingRecord) {
      // Insert the record if it doesn't exist
      const newRecord = await prisma.replicacheServer.create({
        data: {
          id: serverID,
          version: 1,
        },
      });
      console.log("Inserted new record:", newRecord);
    } else {
      console.log("Record already exists:", existingRecord);
    }
  } catch (error) {
    console.error("Error in seed operation:", error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
