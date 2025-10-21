import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Get the company (should already exist from init)
  const company = await prisma.company.findFirst({
    where: { isActive: true },
  });

  if (!company) {
    console.error('❌ No company found. Please initialize the app first.');
    return;
  }

  console.log(`✅ Found company: ${company.name}`);

  // Create test members
  const testMembers = [
    {
      whopUserId: 'user_test_001',
      email: 'john.doe@example.com',
      username: 'johndoe',
      status: 'active',
      currentPlan: 'Premium Plan',
      planId: 'plan_premium_001',
      totalRevenue: 297,
      monthlyRevenue: 99,
      lifetimeValue: 297,
      engagementScore: 85,
      firstJoinedAt: new Date('2025-01-15'),
    },
    {
      whopUserId: 'user_test_002',
      email: 'sarah.smith@example.com',
      username: 'sarahsmith',
      status: 'active',
      currentPlan: 'Starter Plan',
      planId: 'plan_starter_001',
      totalRevenue: 147,
      monthlyRevenue: 49,
      lifetimeValue: 147,
      engagementScore: 92,
      firstJoinedAt: new Date('2025-02-01'),
    },
    {
      whopUserId: 'user_test_003',
      email: 'mike.johnson@example.com',
      username: 'mikej',
      status: 'cancelled',
      currentPlan: 'Premium Plan',
      planId: 'plan_premium_001',
      totalRevenue: 99,
      monthlyRevenue: 0,
      lifetimeValue: 99,
      engagementScore: 45,
      cancelledAt: new Date('2025-10-15'),
      firstJoinedAt: new Date('2025-09-15'),
    },
    {
      whopUserId: 'user_test_004',
      email: 'emily.davis@example.com',
      username: 'emilyd',
      status: 'active',
      currentPlan: 'Pro Plan',
      planId: 'plan_pro_001',
      totalRevenue: 594,
      monthlyRevenue: 199,
      lifetimeValue: 594,
      engagementScore: 78,
      firstJoinedAt: new Date('2025-07-01'),
    },
    {
      whopUserId: 'user_test_005',
      email: 'david.wilson@example.com',
      username: 'davidw',
      status: 'active',
      currentPlan: 'Starter Plan',
      planId: 'plan_starter_001',
      totalRevenue: 49,
      monthlyRevenue: 49,
      lifetimeValue: 49,
      engagementScore: 65,
      firstJoinedAt: new Date('2025-10-01'),
    },
    {
      whopUserId: 'user_test_006',
      email: 'lisa.brown@example.com',
      username: 'lisab',
      status: 'active',
      currentPlan: 'Premium Plan',
      planId: 'plan_premium_001',
      totalRevenue: 198,
      monthlyRevenue: 99,
      lifetimeValue: 198,
      engagementScore: 88,
      firstJoinedAt: new Date('2025-08-15'),
    },
    {
      whopUserId: 'user_test_007',
      email: 'james.taylor@example.com',
      username: 'jamest',
      status: 'past_due',
      currentPlan: 'Premium Plan',
      planId: 'plan_premium_001',
      totalRevenue: 297,
      monthlyRevenue: 99,
      lifetimeValue: 297,
      engagementScore: 55,
      firstJoinedAt: new Date('2025-07-01'),
    },
    {
      whopUserId: 'user_test_008',
      email: 'anna.martinez@example.com',
      username: 'annam',
      status: 'active',
      currentPlan: 'Pro Plan',
      planId: 'plan_pro_001',
      totalRevenue: 398,
      monthlyRevenue: 199,
      lifetimeValue: 398,
      engagementScore: 95,
      firstJoinedAt: new Date('2025-08-01'),
    },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const memberData of testMembers) {
    try {
      const existing = await prisma.member.findUnique({
        where: { whopUserId: memberData.whopUserId },
      });

      if (existing) {
        console.log(`⏭️  Skipping ${memberData.email} (already exists)`);
        skippedCount++;
        continue;
      }

      const member = await prisma.member.create({
        data: {
          ...memberData,
          companyId: company.id,
        },
      });

      // Create a membership record
      await prisma.membership.create({
        data: {
          whopMembershipId: `membership_test_${memberData.whopUserId}`,
          memberId: member.id,
          planId: memberData.planId,
          planName: memberData.currentPlan || 'Unknown Plan',
          status: memberData.status,
          price: memberData.monthlyRevenue,
          currency: 'usd',
          interval: 'month',
          startedAt: memberData.firstJoinedAt,
          renewsAt: memberData.status === 'active' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
          cancelledAt: memberData.cancelledAt,
        },
      });

      // Create some events for each member
      const eventTypes = [
        { type: 'membership_created', days: -90 },
        { type: 'payment_succeeded', days: -60 },
        { type: 'payment_succeeded', days: -30 },
      ];

      if (memberData.status === 'cancelled') {
        eventTypes.push({ type: 'membership_cancelled', days: -5 });
      }

      for (const { type, days } of eventTypes) {
        await prisma.event.create({
          data: {
            type,
            memberId: member.id,
            data: { test: true },
            occurredAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
          },
        });
      }

      console.log(`✅ Created member: ${memberData.email}`);
      createdCount++;
    } catch (error) {
      console.error(`❌ Error creating ${memberData.email}:`, error);
    }
  }

  // Create some tags
  const tags = ['VIP', 'At Risk', 'New Member', 'Power User', 'Churned'];
  const createdTags = [];

  for (const tagName of tags) {
    const tag = await prisma.tag.upsert({
      where: {
        companyId_name: {
          companyId: company.id,
          name: tagName,
        },
      },
      update: {},
      create: {
        name: tagName,
        companyId: company.id,
        color: getTagColor(tagName),
      },
    });
    createdTags.push(tag);
  }

  console.log(`✅ Created ${tags.length} tags`);

  // Assign tags to some members
  const members = await prisma.member.findMany({
    where: { companyId: company.id },
  });

  if (members.length > 0) {
    // Tag high-value members as VIP
    const vipTag = createdTags.find(t => t.name === 'VIP');
    const highValueMembers = members.filter(m => m.totalRevenue > 200);

    for (const member of highValueMembers) {
      if (vipTag) {
        await prisma.memberTag.upsert({
          where: {
            tagId_memberId: {
              tagId: vipTag.id,
              memberId: member.id,
            },
          },
          update: {},
          create: {
            tagId: vipTag.id,
            memberId: member.id,
          },
        });
      }
    }

    // Tag cancelled members
    const churnedTag = createdTags.find(t => t.name === 'Churned');
    const cancelledMembers = members.filter(m => m.status === 'cancelled');

    for (const member of cancelledMembers) {
      if (churnedTag) {
        await prisma.memberTag.upsert({
          where: {
            tagId_memberId: {
              tagId: churnedTag.id,
              memberId: member.id,
            },
          },
          update: {},
          create: {
            tagId: churnedTag.id,
            memberId: member.id,
          },
        });
      }
    }
  }

  // Create a sample note
  if (members.length > 0) {
    await prisma.note.create({
      data: {
        content: 'Reached out about recent inactivity. User mentioned being busy with work.',
        memberId: members[0].id,
        companyId: company.id,
      },
    });
    console.log(`✅ Created sample note`);
  }

  console.log('\n🎉 Seeding complete!');
  console.log(`📊 Summary:`);
  console.log(`   - Created: ${createdCount} members`);
  console.log(`   - Skipped: ${skippedCount} members (already existed)`);
  console.log(`   - Tags: ${tags.length}`);
  console.log(`   - Events: ${createdCount * 3} events`);
}

function getTagColor(tagName: string): string {
  const colors: Record<string, string> = {
    'VIP': '#10b981',
    'At Risk': '#f59e0b',
    'New Member': '#3b82f6',
    'Power User': '#8b5cf6',
    'Churned': '#ef4444',
  };
  return colors[tagName] || '#6b7280';
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
