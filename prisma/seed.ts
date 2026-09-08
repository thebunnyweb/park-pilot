import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@parkpilot.app";
  const passwordHash = await bcrypt.hash("disneyworld", 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Demo Planner", passwordHash },
  });

  const count = await prisma.traveller.count({ where: { userId: user.id } });
  if (count === 0) {
    const thisYear = new Date().getFullYear();
    await prisma.traveller.createMany({
      data: [
        {
          userId: user.id,
          name: "Parent A",
          birthdate: new Date(`${thisYear - 34}-05-10`),
          heightInInches: 70,
          thrillTolerance: "high",
          needsMiddayBreak: false,
        },
        {
          userId: user.id,
          name: "Parent B",
          birthdate: new Date(`${thisYear - 33}-09-02`),
          heightInInches: 65,
          thrillTolerance: "medium",
          needsMiddayBreak: false,
        },
        {
          userId: user.id,
          name: "Daughter",
          birthdate: new Date(`${thisYear - 2}-03-15`),
          heightInInches: 34,
          thrillTolerance: "low",
          needsMiddayBreak: true,
        },
      ],
    });
  }

  console.log(`Seeded demo account: ${email} / disneyworld`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
