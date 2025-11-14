import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import { z } from 'zod'

const storePath = path.join(process.cwd(), 'data', 'dashboard-agents.json')

const dashboardAgentRawSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(['agent', 'admin']),
  passwordHash: z.string().min(1),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const dashboardAgentRawArraySchema = z.array(dashboardAgentRawSchema)

export type DashboardAgentRaw = z.infer<typeof dashboardAgentRawSchema>
export type DashboardAgent = Omit<DashboardAgentRaw, 'passwordHash'>

const sanitizeAgent = (agent: DashboardAgentRaw): DashboardAgent => {
  const { passwordHash, ...rest } = agent
  return rest
}

const ensureStoreFile = async () => {
  try {
    await fs.access(storePath)
  } catch {
    await fs.mkdir(path.dirname(storePath), { recursive: true })
    await fs.writeFile(storePath, '[]', 'utf-8')
  }
}

const readAgentsRaw = async (): Promise<DashboardAgentRaw[]> => {
  await ensureStoreFile()
  const fileContents = await fs.readFile(storePath, 'utf-8')
  const parsed = JSON.parse(fileContents || '[]')
  return dashboardAgentRawArraySchema.parse(parsed)
}

const writeAgentsRaw = async (agents: DashboardAgentRaw[]) => {
  await fs.writeFile(storePath, JSON.stringify(agents, null, 2), 'utf-8')
}

export const listDashboardAgents = async (): Promise<DashboardAgent[]> => {
  const agents = await readAgentsRaw()
  return agents.map(sanitizeAgent)
}

export const getDashboardAgentByEmail = async (email: string): Promise<DashboardAgentRaw | null> => {
  const agents = await readAgentsRaw()
  const agent = agents.find((item) => item.email.toLowerCase() === email.toLowerCase())
  return agent ?? null
}

export const getDashboardAgentById = async (id: number): Promise<DashboardAgentRaw | null> => {
  const agents = await readAgentsRaw()
  const agent = agents.find((item) => item.id === id)
  return agent ?? null
}

export const hashPassword = (plainTextPassword: string): string => {
  return crypto.createHash('sha256').update(plainTextPassword).digest('hex')
}

type UpdateAgentPayload = {
  password?: string
  isActive?: boolean
}

export const updateDashboardAgent = async (
  id: number,
  payload: UpdateAgentPayload,
): Promise<DashboardAgent> => {
  if (!payload.password && payload.isActive === undefined) {
    throw new Error('Nicio modificare de aplicat.')
  }

  const agents = await readAgentsRaw()
  const agentIndex = agents.findIndex((item) => item.id === id)

  if (agentIndex === -1) {
    throw new Error('Agentul nu a fost găsit.')
  }

  const agent = agents[agentIndex]
  const updatedAgent: DashboardAgentRaw = {
    ...agent,
    updatedAt: new Date().toISOString(),
    ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
    ...(payload.password ? { passwordHash: hashPassword(payload.password) } : {}),
  }

  agents[agentIndex] = updatedAgent
  await writeAgentsRaw(agents)

  return sanitizeAgent(updatedAgent)
}


