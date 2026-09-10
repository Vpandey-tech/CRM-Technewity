const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const secret = process.env.JWT_SECRET_KEY || 'cUBrGy23dF9nmF5AFjOM//1/vWcrwYmuEySx6SdwHbhz2NJpm3NcQWXgB5tB5wPE';
const refreshSecret = process.env.JWT_REFRESH_KEY || 'AmdXBMwqJvwmhzPuTLvZ3eBBu6o/Px6R7ZJG0K1pFfNqj0Ux506WdMxEpIJ1CfL9';

const PROJECT_ID = '6a86edc41f82be8f2ade7888'; // technewity labs AI Core Team
const ORG_ID = '6a6ae824f587e315ef597234';

async function runRegressionSuite() {
  console.log('================================================================');
  console.log('       TECHNEWITY CRM BRUTAL END-TO-END REGRESSION TEST');
  console.log('================================================================\n');

  // 1. Verify Users & Project
  const sanket = await prisma.user.findFirst({ where: { email: 'snket2005d@gmail.com' } });
  const vivek = await prisma.user.findFirst({ where: { email: 'vp983351@gmail.com' } });
  const project = await prisma.project.findUnique({ where: { id: PROJECT_ID } });

  if (!sanket || !vivek || !project) {
    console.error('Prerequisites missing: users or project not found in database!');
    process.exit(1);
  }

  console.log(`✓ Sender: ${sanket.name} (${sanket.email})`);
  console.log(`✓ Target Assignee / Lead: ${vivek.name} (${vivek.email})`);
  console.log(`✓ Target Workspace: ${project.name} (Org: ${ORG_ID})\n`);

  const token = jwt.sign(
    { id: sanket.id, email: sanket.email, name: sanket.name, photo: sanket.photo },
    secret,
    { expiresIn: '1h' }
  );
  const refreshToken = jwt.sign(
    { email: sanket.email, rememberMe: true },
    refreshSecret,
    { expiresIn: '30d' }
  );

  // 2. Define all command test cases
  const testCases = [
    {
      id: 'CMD-1',
      name: 'TASK Command with Lead, Tags, Priority, Due Date & Checklist',
      content: `/task @bot Deploy Neural Inference Pipeline lead: @VIVEK PANDEY #backend #ml priority: high points: 5 due: in 4 days\n- Validate latency under 50ms\n- Benchmark GPU memory consumption`,
      mentionUserIds: [vivek.id],
      expectedType: 'TASK',
      expectTask: true
    },
    {
      id: 'CMD-2',
      name: 'BUG Command with Critical Priority & Lead',
      content: `/bug @bot Fix race condition in WebSocket real-time broadcast lead: @VIVEK PANDEY priority: urgent due: tomorrow`,
      mentionUserIds: [vivek.id],
      expectedType: 'BUG',
      expectTask: true
    },
    {
      id: 'CMD-3',
      name: 'FEATURE Command with Tags & Custom Priority',
      content: `/feature @bot Autonomous WhatsApp Voice Assistant lead: @VIVEK PANDEY #voice #ai priority: high`,
      mentionUserIds: [vivek.id],
      expectedType: 'NEW_FEATURE',
      expectTask: true
    },
    {
      id: 'CMD-4',
      name: 'IMPROVEMENT Command with Lead & Optimization Details',
      content: `/improvement @bot Boost Redis query throughput and connection reuse lead: @VIVEK PANDEY priority: normal`,
      mentionUserIds: [vivek.id],
      expectedType: 'IMPROVEMENT',
      expectTask: true
    },
    {
      id: 'CMD-5',
      name: 'REPORT Command with Email Delivery to Vivek',
      content: `/report @bot generate weekly progress report and email to vp983351@gmail.com`,
      mentionUserIds: [vivek.id],
      expectedType: null,
      expectTask: false,
      expectEmail: true
    },
    {
      id: 'CMD-6',
      name: 'SCHEDULE Command for Recurring Automated Project Monitoring',
      content: `/schedule @bot send weekly report every monday at 10am`,
      mentionUserIds: [vivek.id],
      expectedType: null,
      expectTask: false,
      expectSchedule: true
    },
    {
      id: 'CMD-7',
      name: 'EMAIL Command for Live Notification Dispatch to Vivek',
      content: `/email @bot Send launch checklist to vp983351@gmail.com with subject: Technewity CRM Regression Verified All regression checks passing with 100% verified DB records.`,
      mentionUserIds: [vivek.id],
      expectedType: null,
      expectTask: false,
      expectEmail: true
    },
    {
      id: 'CMD-8',
      name: 'GENERAL AI Mention (@bot asking question)',
      content: `@bot Can you give a quick update on current project deliverables?`,
      mentionUserIds: [],
      expectedType: null,
      expectTask: false
    }
  ];

  let passedCount = 0;
  let failedCount = 0;

  for (const tc of testCases) {
    console.log('────────────────────────────────────────────────────────────────');
    console.log(`[${tc.id}] RUNNING: ${tc.name}`);
    console.log(`Payload: "${tc.content.split('\n')[0]}"`);

    const res = await fetch(`http://localhost:3333/api/project/${PROJECT_ID}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: token,
        refreshtoken: refreshToken
      },
      body: JSON.stringify({
        content: tc.content,
        mentionUserIds: tc.mentionUserIds,
        organizationId: ORG_ID,
        projectId: PROJECT_ID
      })
    });

    const data = await res.json();
    if (res.status !== 200 || data.status !== 200) {
      console.error(`❌ FAILED to send message (HTTP ${res.status}):`, data);
      failedCount++;
      continue;
    }

    const messageId = data.data.id;
    console.log(`✓ HTTP 200 - Chat Message Created (ID: ${messageId}, Status: ${data.data.status})`);
    process.stdout.write('  Waiting for Bot Orchestrator async execution');

    let updatedMsg = null;
    const startTime = Date.now();
    while (Date.now() - startTime < 14000) {
      await new Promise((r) => setTimeout(r, 1000));
      process.stdout.write('.');
      updatedMsg = await prisma.chatMessage.findUnique({ where: { id: messageId } });
      if (updatedMsg && (updatedMsg.status === 'COMPLETED' || updatedMsg.status === 'FAILED')) {
        break;
      }
    }
    console.log('');
    console.log(`✓ Bot Result: Status = ${updatedMsg?.status}, LinkedTask = ${updatedMsg?.linkedTaskId || 'None'}`);

    if (updatedMsg.status !== 'COMPLETED') {
      console.error(`❌ Message status is ${updatedMsg.status} (expected COMPLETED)`);
      if (updatedMsg.errorMessage) {
        console.error(`   Error message: ${updatedMsg.errorMessage}`);
      }
      failedCount++;
      continue;
    }

    // If task was expected, verify DB Task record
    if (tc.expectTask) {
      if (!updatedMsg.linkedTaskId) {
        console.error('❌ Expected linkedTaskId, but none was returned!');
        failedCount++;
        continue;
      }

      const task = await prisma.task.findUnique({ where: { id: updatedMsg.linkedTaskId } });
      const statusObj = await prisma.taskStatus.findUnique({ where: { id: task.taskStatusId } });

      console.log('  [DB Task Verification]:');
      console.log(`    - Task ID: ${task.id}`);
      console.log(`    - Title: "${task.title}"`);
      console.log(`    - Type: ${task.type} (Expected: ${tc.expectedType})`);
      console.log(`    - Status Column: ${statusObj?.name} (Type: ${statusObj?.type})`);
      console.log(`    - Priority: ${task.priority}`);
      console.log(`    - Assignee IDs: ${task.assigneeIds.join(', ')} (Vivek included: ${task.assigneeIds.includes(vivek.id)})`);
      console.log(`    - Lead ID: ${task.leadId} (Vivek: ${task.leadId === vivek.id})`);
      console.log(`    - Tag IDs: ${task.tagIds.length > 0 ? task.tagIds.join(', ') : 'none'}`);
      console.log(`    - Points: ${task.taskPoint || 'none'}`);
      console.log(`    - Due Date: ${task.dueDate ? task.dueDate.toISOString() : 'none'}`);

      // Check checklists if any
      const checklists = await prisma.taskChecklist.findMany({ where: { taskId: task.id } });
      if (checklists.length > 0) {
        console.log(`    - Checklists (${checklists.length} items):`);
        checklists.forEach((c) => console.log(`      * [${c.done ? 'x' : ' '}] ${c.title}`));
      }

      // Check In-App Notification for Vivek
      const notif = await prisma.notification.findFirst({
        where: { userId: vivek.id, organizationId: ORG_ID },
        orderBy: { createdAt: 'desc' }
      });
      if (notif) {
        console.log(`    - In-App Notification: "${notif.title}"`);
      }
    }

    // If schedule was expected, verify Scheduler table in DB
    if (tc.expectSchedule) {
      const scheduleRecord = await prisma.scheduler.findFirst({
        where: { projectId: PROJECT_ID, organizationId: ORG_ID },
        orderBy: { createdAt: 'desc' }
      });
      if (scheduleRecord) {
        console.log('  [DB Scheduler Verification]:');
        console.log(`    - Scheduler ID: ${scheduleRecord.id}`);
        console.log(`    - Trigger: ${JSON.stringify(scheduleRecord.trigger)}`);
        console.log(`    - Action: ${JSON.stringify(scheduleRecord.action)}`);
      } else {
        console.error('❌ Scheduler record not found in DB!');
        failedCount++;
        continue;
      }
    }

    // Verify Bot Reply message exists
    const botReply = await prisma.chatMessage.findFirst({
      where: { projectId: PROJECT_ID, isBotReply: true },
      orderBy: { createdAt: 'desc' }
    });
    if (botReply) {
      const cleanReply = botReply.content.replace(/<[^>]*>/g, '').trim();
      console.log(`  Bot Reply: "${cleanReply.slice(0, 100)}..."`);
    }

    console.log(`>>> [${tc.id}] PASSED!\n`);
    passedCount++;
  }

  console.log('================================================================');
  console.log(`REGRESSION RESULTS: ${passedCount} PASSED | ${failedCount} FAILED out of ${testCases.length} TESTS`);
  console.log('================================================================');

  await prisma.$disconnect();
  if (failedCount > 0) {
    process.exit(1);
  }
}

runRegressionSuite().catch((err) => {
  console.error('Regression suite fatal error:', err);
  process.exit(1);
});
