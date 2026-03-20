import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function daysAgo(n: number, base: Date = new Date()): Date {
  const d = new Date(base)
  d.setDate(d.getDate() - n)
  return d
}

function daysFromNow(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

function multiPick<T>(arr: T[], min: number, max: number): T[] {
  const count = rand(min, max)
  return [...arr].sort(() => Math.random() - 0.5).slice(0, count)
}

function weightedPick<T>(items: T[], weights: number[]): T {
  const r = Math.random()
  let sum = 0
  for (let i = 0; i < items.length; i++) {
    sum += weights[i]
    if (r <= sum) return items[i]
  }
  return items[items.length - 1]
}

/** Cycle through a pattern array to produce `count` statuses */
function buildStatuses(count: number, pattern: string[]): string[] {
  return Array.from({ length: count }, (_, i) => pattern[i % pattern.length])
}

// ─── Static reference data ────────────────────────────────────────────────────

const FIRST_NAMES = [
  'สมชาย', 'วิชัย', 'อนุชา', 'กิตติ', 'ธนากร',
  'ประสิทธิ์', 'สุรชัย', 'ณัฐพล', 'ปิยะ', 'ชาญณรงค์',
  'วีระ', 'ภูมิพัฒน์', 'กฤษณะ', 'อภิชาต', 'มงคล',
  'นพดล', 'รัชพล', 'เกรียงไกร', 'พิชิต', 'ศักดิ์ชัย',
  'สมศรี', 'วิไล', 'อรุณี', 'กาญจนา', 'ธิดารัตน์',
  'ประภา', 'สุภาพร', 'ณัฐมล', 'ปิยาพร', 'ชญาภา',
  'วรรณา', 'ภัทรา', 'อภิญญา', 'มาลี', 'นพมาศ',
  'รัตนา', 'เกศรา', 'พิมพ์พรรณ', 'ศศิธร', 'ชลธิชา',
  'ไพโรจน์', 'พงศ์ธร', 'บัณฑิต', 'อดุลย์', 'ไพลิน',
  'บุษกร', 'อรทัย', 'จันทร์เพ็ญ', 'สมหมาย', 'วันชัย',
]

const LAST_NAMES = [
  'สุขสันต์', 'วงศ์สกุล', 'ทองดี', 'แสงสว่าง', 'รัตนวิจิตร',
  'พงษ์พิทักษ์', 'บุญมี', 'ศิริวงศ์', 'ลิ้มประเสริฐ', 'กิตติวงศ์',
  'เพชรรัตน์', 'สมบูรณ์', 'พัฒนาการ', 'มีชัย', 'ประเสริฐ',
  'วิเชียร', 'อัมพร', 'โชติ', 'ชัยชนะ', 'ดีใจ',
  'เจริญ', 'สิทธิผล', 'ยิ่งยง', 'บูรณะ', 'รุ่งเรือง',
  'คงสวัสดิ์', 'ใจดี', 'นาคา', 'พรมมา', 'สายทอง',
]

const NICKNAMES = [
  'โอม', 'บิ๊ก', 'เอ', 'บอย', 'โจ้', 'กุ้ง', 'ปุ๊',
  'แบงค์', 'ไอซ์', 'นิว', 'เม', 'แบม', 'เอ็ม', 'บิ้ว',
  'ป้อม', 'จ๋า', 'ฝน', 'พลอย', 'ออย', 'เปิ้ล',
  'กล้วย', 'มิ้น', 'แป้ง', 'ไก่', 'ขนม',
  'นุ่น', 'อ้อ', 'หนู', 'ติ๋ม', 'บู',
]

const JOB_CATEGORIES = [
  'พนักงานบริษัท', 'ข้าราชการ', 'ประกอบธุรกิจ',
  'แม่บ้าน', 'อาชีพอิสระ', 'นักศึกษา',
]

const SOURCE_CHANNELS = ['Facebook', 'LINE', 'เพื่อนแนะนำ', 'YouTube', 'Google']

const LOAN_RANGES = [
  'ต่ำกว่า 100,000',
  '100,000 - 500,000',
  '500,001 - 1,000,000',
  'มากกว่า 1,000,000',
]

const CHANNELS_OPTIONS = ['Facebook', 'LINE', 'YouTube', 'เพื่อนแนะนำ', 'Google', 'อื่นๆ']

const OBJECTIVES = [
  'ต้องการปลดหนี้',
  'ต้องการสร้างรายได้เพิ่ม',
  'ต้องการลงทุนอสังหาริมทรัพย์',
  'ต้องการวางแผนเกษียณ',
  'ต้องการสร้างอิสรภาพทางการเงิน',
  'ต้องการบริหารเงินออม',
]

const CREDIT_BANKS = [
  'กสิกรไทย', 'ไทยพาณิชย์', 'กรุงเทพ', 'กรุงไทย',
  'กรุงศรี', 'ทหารไทยธนชาต', 'ออมสิน', 'อาคารสงเคราะห์',
]

const LOAN_PROBLEMS = [
  'ดอกเบี้ยสูง ผ่อนหนัก',
  'มีหนี้หลายแห่ง จ่ายไม่ครบ',
  'ค่างวดเกิน 40% ของรายได้',
  'เครดิตบูโรมีปัญหา',
  'ต้องการรีไฟแนนซ์',
]

const PAYMENT_METHODS = ['promptpay', 'credit_card', 'bank_transfer']

const ASSIGNED_TO = ['คุณมะลิ', 'คุณสมหมาย', 'คุณดาวเรือง', 'คุณประทีป']

const CRM_STAGES = ['new', 'contacted', 'interested', 'proposal', 'closed_won', 'closed_lost']
// Weighted toward mid-funnel (interested/contacted) which is most realistic
const CRM_STAGE_WEIGHTS = [0.08, 0.25, 0.30, 0.20, 0.10, 0.07]

const INTERACTION_CHANNELS = ['LINE', 'โทรศัพท์', 'Facebook', 'Email']

const INTERACTION_OUTCOMES = [
  'สนใจ ติดตามต่อ', 'ยังไม่พร้อม', 'นัดหมายเพิ่มเติม',
  'ส่งข้อมูลเพิ่ม', 'ปิดการขายได้', 'ไม่สนใจ',
]

const INTERACTION_CONTENTS = [
  'โทรแนะนำหลักสูตร Win Win Wealth ขั้นต่อไป',
  'ส่งข้อมูล PDF แผนการเงินส่วนบุคคล ทางอีเมล',
  'นัดพบเพื่อวางแผนสินเชื่อและโครงสร้างหนี้',
  'ติดตามการตัดสินใจสมัครหลักสูตร Premium',
  'อัปเดตโปรโมชั่นพิเศษสำหรับสมาชิกเก่า',
  'แนะนำผลิตภัณฑ์สินเชื่อบ้านดอกเบี้ยต่ำ',
  'สอบถามความพึงพอใจหลังเข้าสัมมนา',
  'เชิญเข้าร่วมกลุ่ม LINE OA Win Win Wealth',
  'ส่งลิงก์วิดีโอสรุปเนื้อหาสัมมนาครั้งที่ผ่านมา',
  'แจ้งกำหนดการสัมมนารุ่นถัดไป',
]

const EMAIL_DOMAINS = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'icloud.com']
const PHONE_PREFIXES = ['061', '062', '063', '065', '080', '081', '082', '086', '089', '091', '092', '095', '097', '098']

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding Win Win Wealth database...\n')

  // Clear in reverse FK order
  await prisma.webhookLog.deleteMany()
  await prisma.interaction.deleteMany()
  await prisma.contact.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.registrationProfile.deleteMany()
  await prisma.registration.deleteMany()
  await prisma.registrant.deleteMany()
  await prisma.courseEvent.deleteMany()
  console.log('✓ Cleared existing data')

  // ─── Course Events ──────────────────────────────────────────────────────────
  const [e1, e2, e3, e4, e5] = await Promise.all([
    prisma.courseEvent.create({ data: {
      seminarId: 'WWS-2501',
      courseName: 'เส้นทางสู่อิสรภาพทางการเงิน รุ่นที่ 1',
      courseType: 'wealth',
      eventDate: new Date('2025-01-18'),
      venue: 'โรงแรม เดอะ สุโกศล กรุงเทพฯ',
      deliveryMode: 'onsite',
      maxSeats: 40,
      price: 2900,
      status: 'completed',
    }}),
    prisma.courseEvent.create({ data: {
      seminarId: 'WWS-2502',
      courseName: 'เส้นทางสู่อิสรภาพทางการเงิน รุ่นที่ 2',
      courseType: 'wealth',
      eventDate: new Date('2025-02-15'),
      venue: 'โรงแรม อมารี วอเตอร์เกท กรุงเทพ',
      deliveryMode: 'onsite',
      maxSeats: 40,
      price: 2900,
      status: 'completed',
    }}),
    prisma.courseEvent.create({ data: {
      seminarId: 'WWS-2503',
      courseName: 'กลยุทธ์ลงทุนอสังหาริมทรัพย์ รุ่นที่ 1',
      courseType: 'realestate',
      eventDate: new Date('2025-03-08'),
      venue: 'True Digital Park, กรุงเทพฯ',
      deliveryMode: 'onsite',
      maxSeats: 50,
      price: 3500,
      status: 'completed',
    }}),
    prisma.courseEvent.create({ data: {
      seminarId: 'WWS-2504',
      courseName: 'บริหารหนี้ สร้างความมั่งคั่ง',
      courseType: 'debt',
      eventDate: new Date('2025-03-22'),
      venue: 'Zoom Online',
      deliveryMode: 'online',
      maxSeats: 100,
      price: 1900,
      status: 'ongoing',
    }}),
    prisma.courseEvent.create({ data: {
      seminarId: 'WWS-2505',
      courseName: 'กลยุทธ์ลงทุนอสังหาริมทรัพย์ รุ่นที่ 2',
      courseType: 'realestate',
      eventDate: new Date('2025-04-12'),
      venue: 'โรงแรม เซ็นทาราแกรนด์ เซ็นทรัล พลาซา ลาดพร้าว',
      deliveryMode: 'onsite',
      maxSeats: 50,
      price: 3500,
      status: 'upcoming',
    }}),
  ])
  console.log('✓ Created 5 course events')

  // ─── Registration batches ───────────────────────────────────────────────────
  // Each entry: event, number of registrants, registration date base, status cycle
  const batches = [
    {
      event: e1,
      count: 28,
      regDaysAgo: 90,
      // completed event: heavy attendance, some cancellations/no-shows
      statusPattern: [
        'attended','attended','attended','attended','attended',
        'attended','attended','attended','attended','attended',
        'attended','attended','attended','attended','attended',
        'confirmed','confirmed','confirmed','confirmed',
        'cancelled','cancelled','cancelled',
        'no_show','no_show',
        'pending','pending','pending','pending',
      ],
    },
    {
      event: e2,
      count: 22,
      regDaysAgo: 60,
      statusPattern: [
        'attended','attended','attended','attended','attended',
        'attended','attended','attended','attended','attended',
        'attended','attended',
        'confirmed','confirmed','confirmed',
        'cancelled','cancelled',
        'no_show','no_show',
        'pending','pending',
      ],
    },
    {
      event: e3,
      count: 18,
      regDaysAgo: 25,
      statusPattern: [
        'attended','attended','attended','attended','attended',
        'attended','attended','attended','attended',
        'confirmed','confirmed','confirmed',
        'cancelled','cancelled','cancelled',
        'no_show',
        'pending','pending',
      ],
    },
    {
      event: e4,
      count: 14,
      regDaysAgo: 12,
      // ongoing event: mostly confirmed + some pending
      statusPattern: [
        'confirmed','confirmed','confirmed','confirmed','confirmed',
        'confirmed','confirmed','confirmed',
        'pending','pending','pending','pending',
        'cancelled',
        'no_show',
      ],
    },
    {
      event: e5,
      count: 9,
      regDaysAgo: 5,
      // upcoming: mostly pending
      statusPattern: [
        'pending','pending','pending','pending','pending',
        'confirmed','confirmed',
        'cancelled',
        'pending',
      ],
    },
  ]

  // Contacts to create after registrations
  const contactQueue: Array<{
    registrantId: string
    crmStage: string
    assignedTo: string
    regDate: Date
  }> = []

  let nameIdx = 0
  let totalRegs = 0

  for (const batch of batches) {
    const statuses = buildStatuses(batch.count, batch.statusPattern)

    for (let i = 0; i < batch.count; i++) {
      const firstName = FIRST_NAMES[nameIdx % FIRST_NAMES.length]
      const lastName = LAST_NAMES[(nameIdx * 7 + 3) % LAST_NAMES.length]
      const nickname = NICKNAMES[nameIdx % NICKNAMES.length]
      const job = pick(JOB_CATEGORIES)
      const source = pick(SOURCE_CHANNELS)
      const status = statuses[i]
      const regDate = daysAgo(batch.regDaysAgo - rand(0, 18))
      const loanRange = pick(LOAN_RANGES)
      const hadLoanBefore = Math.random() > 0.42
      const channelsCsv = multiPick(CHANNELS_OPTIONS, 1, 3).join(',')

      // Registrant
      const registrant = await prisma.registrant.create({
        data: {
          firstName,
          lastName,
          nickname,
          email: `${firstName.length}${lastName.length}user${rand(100, 9999)}${nameIdx}@${pick(EMAIL_DOMAINS)}`,
          phone: `${pick(PHONE_PREFIXES)}-${rand(100, 999)}-${rand(1000, 9999)}`,
          jobCategory: job,
          sourceChannel: source,
        },
      })

      // Registration
      const registration = await prisma.registration.create({
        data: {
          eventId: batch.event.id,
          registrantId: registrant.id,
          seminarId: batch.event.seminarId,
          regStatus: status,
          registeredAt: regDate,
          formPayload: {
            source_channel: source,
            job_category: job,
            utm_source: source.toLowerCase().replace(' ', '_'),
          },
        },
      })

      // Registration profile
      await prisma.registrationProfile.create({
        data: {
          registrationId: registration.id,
          loanBefore: hadLoanBefore,
          loanAmountRange: loanRange,
          creditBanks: hadLoanBefore ? multiPick(CREDIT_BANKS, 1, 2).join(',') : null,
          channels: channelsCsv,
          objective: pick(OBJECTIVES),
          loanProblems: hadLoanBefore && Math.random() > 0.3 ? pick(LOAN_PROBLEMS) : null,
        },
      })

      // Payment for confirmed/attended
      if (status === 'attended' || status === 'confirmed') {
        const isPaid = status === 'attended' || Math.random() > 0.15
        await prisma.payment.create({
          data: {
            registrationId: registration.id,
            amount: batch.event.price,
            currency: 'THB',
            method: pick(PAYMENT_METHODS),
            status: isPaid ? 'paid' : 'pending',
            referenceNo: `REF${batch.event.seminarId}-${rand(10000, 99999)}`,
            paidAt: isPaid ? daysAgo(rand(1, 7), regDate) : null,
          },
        })
      }

      // Queue CRM contact for attended, and ~60% of confirmed from past events
      const isPastEvent = ['completed'].includes(batch.event.status)
      if (
        status === 'attended' ||
        (status === 'confirmed' && isPastEvent && Math.random() > 0.4)
      ) {
        contactQueue.push({
          registrantId: registrant.id,
          crmStage: weightedPick(CRM_STAGES, CRM_STAGE_WEIGHTS),
          assignedTo: pick(ASSIGNED_TO),
          regDate,
        })
      }

      nameIdx++
      totalRegs++
    }
  }

  console.log(`✓ Created ${nameIdx} registrants, ${totalRegs} registrations, profiles & payments`)

  // ─── Contacts + Interactions ────────────────────────────────────────────────
  let contactCount = 0
  let interactionCount = 0

  for (const { registrantId, crmStage, assignedTo, regDate } of contactQueue) {
    const lastContactedDate = daysAgo(rand(2, 25))
    const isClosed = crmStage === 'closed_won' || crmStage === 'closed_lost'
    const nextFollowupDate = isClosed ? null : daysFromNow(rand(1, 21))

    const contact = await prisma.contact.create({
      data: {
        registrantId,
        crmStage,
        assignedTo,
        notes: crmStage === 'closed_won'
          ? 'ปิดการขายสำเร็จ ลูกค้าสมัครหลักสูตร Win Win Wealth Premium'
          : crmStage === 'closed_lost'
          ? 'ลูกค้าตัดสินใจไม่ต่อ ยังไม่พร้อมด้านการเงินในขณะนี้'
          : crmStage === 'proposal'
          ? 'ส่ง proposal แพ็คเกจรายบุคคลแล้ว รอการตัดสินใจ'
          : null,
        lastContacted: lastContactedDate,
        nextFollowup: nextFollowupDate,
      },
    })
    contactCount++

    // 1–3 interactions per contact
    const numInteractions = rand(1, 3)
    let interactDate = new Date(lastContactedDate)

    for (let k = 0; k < numInteractions; k++) {
      interactDate = daysAgo(rand(1, 10), interactDate)
      await prisma.interaction.create({
        data: {
          contactId: contact.id,
          channel: pick(INTERACTION_CHANNELS),
          direction: Math.random() > 0.25 ? 'outbound' : 'inbound',
          content: pick(INTERACTION_CONTENTS),
          outcome: pick(INTERACTION_OUTCOMES),
          interactedAt: interactDate,
          createdBy: assignedTo,
        },
      })
      interactionCount++
    }
  }

  console.log(`✓ Created ${contactCount} contacts with ${interactionCount} interactions`)

  // ─── Webhook Logs ───────────────────────────────────────────────────────────
  const webhookEvents = [e1, e2, e3]
  for (const event of webhookEvents) {
    for (let w = 0; w < 4; w++) {
      const firstName = pick(FIRST_NAMES)
      const lastName = pick(LAST_NAMES)
      const isError = w === 3 // last one is an error
      await prisma.webhookLog.create({
        data: {
          seminarId: event.seminarId,
          rawPayload: {
            event: 'form_submit',
            seminar_id: event.seminarId,
            first_name: firstName,
            last_name: lastName,
            email: `${rand(100, 9999)}test@gmail.com`,
            phone: `08${rand(1, 9)}-${rand(100, 999)}-${rand(1000, 9999)}`,
            job_category: pick(JOB_CATEGORIES),
            source_channel: pick(SOURCE_CHANNELS),
            timestamp: new Date(daysAgo(rand(5, 30))).toISOString(),
          },
          status: isError ? 'error' : 'processed',
          errorMsg: isError ? 'Duplicate registration: registrant already exists for this event' : null,
        },
      })
    }
  }
  console.log('✓ Created 12 webhook logs')

  // ─── Summary ────────────────────────────────────────────────────────────────
  const [
    evtCount, regantCount, regCount, profCount,
    payCount, contactCnt, interactCnt, webhookCnt,
  ] = await Promise.all([
    prisma.courseEvent.count(),
    prisma.registrant.count(),
    prisma.registration.count(),
    prisma.registrationProfile.count(),
    prisma.payment.count(),
    prisma.contact.count(),
    prisma.interaction.count(),
    prisma.webhookLog.count(),
  ])

  console.log('\n📊 Database summary:')
  console.log(`   course_events           ${evtCount}`)
  console.log(`   registrants             ${regantCount}`)
  console.log(`   registrations           ${regCount}`)
  console.log(`   registration_profiles   ${profCount}`)
  console.log(`   payments                ${payCount}`)
  console.log(`   contacts                ${contactCnt}`)
  console.log(`   interactions            ${interactCnt}`)
  console.log(`   webhook_logs            ${webhookCnt}`)
  console.log('\n✅ Seed complete!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
