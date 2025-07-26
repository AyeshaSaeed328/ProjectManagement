import { PrismaClient, Project } from "@prisma/client"
import { ApiError } from "../src/utils/ApiError"
const prisma = new PrismaClient()

async function main() {
  let frontend = await prisma.team.findFirst({ where: { teamName: "Frontend Team" } })
  if (!frontend){
    throw new ApiError(400,"Team not found")
  }
  

  let backend = await prisma.team.findFirst({ where: { teamName: "Backend Team" } })
  if (!backend){
        throw new ApiError(400,"Team not found")

  }

  await prisma.user.updateMany({
    where: { id: { in: ["cmdj3e2yt0003vc30ev92k6a5", "cmdj3u1y70001vcdcpbcj56k9"] } }, // Pam & Kelly
    data: { teamId: frontend.id }
  })

  await prisma.user.updateMany({
    where: { id: { in: ["cmdj3gw3u0000vcdcrsfu26nf", "cmdj3w0bx0002vcdcylf91mqx", "cmdj2642d0000vc30u9ikaait"] } }, // Kevin, Toby, Michael
    data: { teamId: backend.id }
  })

  // Continue to project + task creation
  await createProjectsAndTasks(frontend.id, backend.id)
}

async function createProjectsAndTasks(frontendId: string, backendId: string) {
  const michaelId = "cmdj2642d0000vc30u9ikaait"

  // Create two projects managed by Michael
  const [project1, project2] = await Promise.all([
    prisma.project.create({
      data: {
        name: "Internal Dashboard",
        description: "Tool for internal performance tracking",
        startDate: new Date(),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        managerId: michaelId,
        teams: {
          create: [
            { teamId: frontendId },
            { teamId: backendId }
          ]
        }
      }
    }),
    prisma.project.create({
      data: {
        name: "Client Portal",
        description: "Client-facing dashboard and API portal",
        startDate: new Date(),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
        managerId: michaelId,
        teams: {
          create: [
            { teamId: frontendId },
            { teamId: backendId }
          ]
        }
      }
    })
  ])

  const users = await prisma.user.findMany({
    where: {
      id: {
        in: [
          "cmdj3e2yt0003vc30ev92k6a5", // Pam
          "cmdj3u1y70001vcdcpbcj56k9", // Kelly
          "cmdj3gw3u0000vcdcrsfu26nf", // Kevin
          "cmdj3w0bx0002vcdcylf91mqx", // Toby
          "cmdj354qi0002vc3054j9pgxb", // Jim
          "cmdj2wn7b0001vc300keop7yd"  // Dwight
        ]
      }
    }
  })

  const getRandomUsers = (count: number) =>
    [...users].sort(() => 0.5 - Math.random()).slice(0, count)

  async function createTasksForProject(project:Project) {
    const taskCount = Math.floor(Math.random() * 3) + 3 // 3–5
    for (let i = 1; i <= taskCount; i++) {
      const task = await prisma.task.create({
        data: {
          title: `Task ${i} - ${project.name}`,
          description: `Detailed description of Task ${i}`,
          status: "TODO",
          priority: ["LOW", "MEDIUM", "HIGH", "CRITICAL"][i % 4] as any,
          startDate: new Date(),
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * (7 + i)),
          points: i * 2,
          authorId: michaelId,
          projectId: project.id,
          assignedUserId: null // Not used since we're using TaskAssignment
        }
      })

      const assignees = getRandomUsers(2 + (i % 2)) // 2–3
      for (const user of assignees) {
        await prisma.taskAssignment.create({
          data: {
            taskId: task.id,
            userId: user.id
          }
        })
      }
    }
  }

  await createTasksForProject(project1)
  await createTasksForProject(project2)

  console.log("✅ Projects and tasks created using TaskAssignment relation.")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
