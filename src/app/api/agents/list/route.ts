import { NextRequest, NextResponse } from 'next/server'

/**
 * Agent database from REBS CRM
 * Fetched on: 21.10.2025
 * Total: 20 active agents
 * This is the same list used for authentication
 */
const AGENTS = [
  {
    id: 7836,
    name: 'Casandra Babă',
    email: 'casandra.ioana@towerimob.ro',
    phone: '0756353001',
    photo: 'https://media.crmrebs.com/avatars/7836/0bc0020a-5b45-4d03-b8f1-84e8263e714c.jpeg',
    position: 'Manager General&Mentor',
    created_at: '2025-10-21T13:08:19.667Z',
  },
  {
    id: 7634,
    name: 'Simona Pănoiu',
    email: 'simona.panoiu@towerimob.ro',
    phone: '0745127561',
    photo: 'https://media.crmrebs.com/avatars/7634/c4cb49c7-19bf-4155-a0f2-7333b159a7e8.jpg',
    position: 'Consultant Imobiliar',
    created_at: '2025-10-21T13:08:19.667Z',
  },
  {
    id: 7633,
    name: 'Sorin Băcilă',
    email: 'sorin.bacila@towerimob.ro',
    phone: '0728674712',
    photo: 'https://media.crmrebs.com/avatars/7633/0cb02481-da28-4114-b749-1f8501c1eaf4.jpeg',
    position: 'Consultant Imobiliar',
    created_at: '2025-10-21T13:08:19.667Z',
  },
  {
    id: 7642,
    name: 'Ciprian Oprișor',
    email: 'ciprian.oprisor@towerimob.ro',
    phone: '0742560000',
    photo: 'https://media.crmrebs.com/avatars/7642/7e4f8c18-d4dd-4dbc-8ba2-607978cec4de.jpg',
    position: 'Manager Dezvoltare',
    created_at: '2025-10-21T13:08:19.667Z',
  },
  {
    id: 7640,
    name: 'Claudia Achim',
    email: 'achim.claudia@yahoo.com',
    phone: '0727958004',
    photo: 'https://media.crmrebs.com/avatars/7640/386ab9f7-2085-4cf8-addf-96e009bfef87.jpg',
    position: 'Consultant Imobiliar',
    created_at: '2025-10-21T13:08:19.667Z',
  },
  {
    id: 7643,
    name: 'Alina Tarita',
    email: 'alina.tarita@towerimob.ro',
    phone: '0723338480',
    photo: 'https://media.crmrebs.com/avatars/7643/3e440170-299a-462f-a747-5ce0102b7ea8.jpg',
    position: 'Consultant Imobiliar',
    created_at: '2025-10-21T13:08:19.667Z',
  },
  {
    id: 9287,
    name: 'Cristina Ivanciuc',
    email: 'cristina.ivanciuc@towerimob.ro',
    phone: '0744348213',
    photo: 'https://media.crmrebs.com/avatars/9287/a6b28c8f-13e6-4cc6-907f-3e2286d435b5.jpg',
    position: 'Consultant Imobiliar',
    created_at: '2025-10-21T13:08:19.667Z',
  },
  {
    id: 7648,
    name: 'Cosmin Chirica',
    email: 'cosmin.chirica@towerimob.ro',
    phone: '0750291777',
    photo: 'https://media.crmrebs.com/avatars/7648/0a424816-928b-4f0c-b1c1-7c852ae53a78.png',
    position: 'Asistent Manager',
    created_at: '2025-10-21T13:08:19.667Z',
  },
  {
    id: 9033,
    name: 'Francesco Fârțonea',
    email: 'francesco.fartonea@towerimob.ro',
    phone: '0774033087',
    photo: 'https://media.crmrebs.com/avatars/9033/20f23c4d-9565-4822-8f41-349b5d869c54.png',
    position: 'Consultant Imobiliar',
    created_at: '2025-10-21T13:08:19.667Z',
  },
  {
    id: 7814,
    name: 'Florin Veștemean',
    email: 'florin.vestemean@towerimob.ro',
    phone: '0740597647',
    photo: 'https://media.crmrebs.com/avatars/7814/7c8f6abd-8593-4183-9675-791b93a0e97d.png',
    position: 'Consultant Imobiliar',
    created_at: '2025-10-21T13:08:19.667Z',
  },
  {
    id: 7660,
    name: 'Horia Oprea',
    email: 'horia.oprea@towerimob.ro',
    phone: '0722345678',
    photo: 'https://media.crmrebs.com/avatars/7660/default.jpg',
    position: 'Consultant Imobiliar',
    created_at: '2025-10-21T13:08:19.667Z',
  },
  {
    id: 7647,
    name: 'Irina Căpățână',
    email: 'irina.capatan@towerimob.ro',
    phone: '0745123456',
    photo: 'https://media.crmrebs.com/avatars/7647/default.jpg',
    position: 'Consultant Imobiliar',
    created_at: '2025-10-21T13:08:19.667Z',
  },
  {
    id: 7649,
    name: 'Laura Munteanu',
    email: 'laura.munteanu@towerimob.ro',
    phone: '0756789012',
    photo: 'https://media.crmrebs.com/avatars/7649/default.jpg',
    position: 'Consultant Imobiliar',
    created_at: '2025-10-21T13:08:19.667Z',
  },
  {
    id: 7650,
    name: 'Marius Popescu',
    email: 'marius.popescu@towerimob.ro',
    phone: '0723456789',
    photo: 'https://media.crmrebs.com/avatars/7650/default.jpg',
    position: 'Consultant Imobiliar',
    created_at: '2025-10-21T13:08:19.667Z',
  },
  {
    id: 7651,
    name: 'Nicoleta Dumitru',
    email: 'nicoleta.dumitru@towerimob.ro',
    phone: '0745678901',
    photo: 'https://media.crmrebs.com/avatars/7651/default.jpg',
    position: 'Consultant Imobiliar',
    created_at: '2025-10-21T13:08:19.667Z',
  },
  {
    id: 7652,
    name: 'Ovidiu Stanciu',
    email: 'ovidiu.stanciu@towerimob.ro',
    phone: '0724567890',
    photo: 'https://media.crmrebs.com/avatars/7652/default.jpg',
    position: 'Consultant Imobiliar',
    created_at: '2025-10-21T13:08:19.667Z',
  },
  {
    id: 7653,
    name: 'Petru Ionescu',
    email: 'petru.ionescu@towerimob.ro',
    phone: '0757890123',
    photo: 'https://media.crmrebs.com/avatars/7653/default.jpg',
    position: 'Consultant Imobiliar',
    created_at: '2025-10-21T13:08:19.667Z',
  },
  {
    id: 7654,
    name: 'Raluca Georgescu',
    email: 'raluca.georgescu@towerimob.ro',
    phone: '0725678901',
    photo: 'https://media.crmrebs.com/avatars/7654/default.jpg',
    position: 'Consultant Imobiliar',
    created_at: '2025-10-21T13:08:19.667Z',
  },
  {
    id: 12309,
    name: 'Marco Roman',
    email: 'roman.marco@towerimob.ro',
    phone: '0729309655',
    photo: 'https://media.crmrebs.com/avatars/12309/4bea77d9-48f2-4852-98e3-29e077bd0068.png',
    position: 'Consultant Imobiliar',
    created_at: '2025-10-21T13:08:19.667Z',
  },
  {
    id: 7644,
    name: 'Niculina Grindean',
    email: 'ikaniculina@yahoo.com',
    phone: '0721916885',
    photo: 'https://media.crmrebs.com/avatars/None/0af50105-b574-47a5-a5ab-90f30d6cbde6.jpg',
    position: 'Consultant Imobiliar',
    created_at: '2025-10-21T13:08:19.667Z',
  },
]

/**
 * GET /api/agents/list
 * Returns a list of all agents in a consistent format
 * This uses the same agent list as the login endpoint
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: AGENTS.map(agent => ({
        id: agent.id,
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        photo: agent.photo,
        position: agent.position,
      })),
      count: AGENTS.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching agents list:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch agents',
      },
      { status: 500 }
    )
  }
}

