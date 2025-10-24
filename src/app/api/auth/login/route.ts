import { NextRequest, NextResponse } from 'next/server'

/**
 * Agent database from REBS CRM
 * Fetched on: 21.10.2025
 * Total: 20 active agents
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
    name: 'Maria Bolovan',
    email: 'maria.bolovan@towerimob.ro',
    phone: '0744356990',
    photo: 'https://media.crmrebs.com/avatars/7660/1717770d-b840-49ab-86d0-c2e3f035dd61.jpg',
    position: 'Consultant Imobiliar',
    created_at: '2025-10-21T13:08:19.667Z',
  },
  {
    id: 7866,
    name: 'Ovidiu Neagu',
    email: 'ovidiu.neagu@towerimob.ro',
    phone: '0744551356',
    photo: 'https://media.crmrebs.com/avatars/7866/21a77049-c32f-47f6-8c5a-9761e84bc34d.png',
    position: 'Consultant Imobiliar',
    created_at: '2025-10-21T13:08:19.667Z',
  },
  {
    id: 8787,
    name: 'Petru Vidrean',
    email: 'petru.vidrean@towerimob.ro',
    phone: '0774982802',
    photo: 'https://media.crmrebs.com/avatars/8787/412dc670-46eb-4bbc-b277-b006fad25cb1.jpg',
    position: 'Consultant Imobiliar',
    created_at: '2025-10-21T13:08:19.667Z',
  },
  {
    id: 9145,
    name: 'Tudor Veveriță',
    email: 'tudor.veverita@towerimob.ro',
    phone: '0785817372',
    photo: 'https://media.crmrebs.com/avatars/9145/db3c830a-769f-45b0-9fd8-3b8e6091d491.png',
    position: 'Consultant Imobiliar',
    created_at: '2025-10-21T13:08:19.667Z',
  },
  {
    id: 7697,
    name: 'Sebastian Zeicu',
    email: 'sebastian.zeicu@towerimob.ro',
    phone: '0744606444',
    photo: 'https://media.crmrebs.com/avatars/7697/f860269c-a382-4538-95d9-15ede14bea29.jpeg',
    position: 'Consultant Imobiliar',
    created_at: '2025-10-21T13:08:19.667Z',
  },
  {
    id: 11428,
    name: 'Mihaela Butuc',
    email: 'mihaela.butuc@towerimob.ro',
    phone: '0752509095',
    photo: 'https://media.crmrebs.com/avatars/11428/de91d4d9-0fb7-4965-902a-92704bf27990.png',
    position: 'Consultant Imobiliar',
    created_at: '2025-10-21T13:08:19.667Z',
  },
  {
    id: 11641,
    name: 'Cătălin Nasta',
    email: 'catalin.nasta@towerimob.ro',
    phone: '0754951373',
    photo: 'https://media.crmrebs.com/avatars/11641/423ef362-155c-4417-91b1-4c0f16649676.png',
    position: 'Consultant Imobiliar',
    created_at: '2025-10-21T13:08:19.667Z',
  },
  {
    id: 11852,
    name: 'Andrei Fârțonea',
    email: 'andrei.fartonea@towerimob.ro',
    phone: '0771736717',
    photo: 'https://media.crmrebs.com/avatars/11852/65ff7883-97e6-49ba-8366-4aade3afa602.jpg',
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
 * POST /api/auth/login
 * 
 * Authenticates a user by email and password.
 * Password must be "Towerimob2025" for all users.
 * Checks against hardcoded agent list.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email și parola sunt obligatorii' },
        { status: 400 }
      )
    }

    // Check password (same for all agents)
    if (password !== 'Towerimob2025') {
      return NextResponse.json(
        { error: 'Parola este incorectă' },
        { status: 401 }
      )
    }

    // Find agent by email in hardcoded list
    const agent = AGENTS.find((a) => 
      a.email.toLowerCase() === email.toLowerCase()
    )

    if (!agent) {
      console.log(`No agent found with email: ${email}`)
      console.log('Valid emails:', AGENTS.map(a => a.email).join(', '))
      return NextResponse.json(
        { error: 'Nu există cont cu acest email' },
        { status: 401 }
      )
    }

    console.log('Agent logged in:', agent.name)

    // Return authenticated agent data
    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        photo: agent.photo,
        position: agent.position,
        created_at: agent.created_at,
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Eroare la autentificare' },
      { status: 500 }
    )
  }
}

