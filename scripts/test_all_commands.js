const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const secret = 'cUBrGy23dF9nmF5AFjOM//1/vWcrwYmuEySx6SdwHbhz2NJpm3NcQWXgB5tB5wPE';
const refreshSecret = 'AmdXBMwqJvwmhzPuTLvZ3eBBu6o/Px6R7ZJG0K1pFfNqj0Ux506WdMxEpIJ1CfL9';

const PROJECT_ID = '6a86edc41f82be8f2ade7888'; // technewity labs AI Core Team
const ORG_ID = '6a6ae824f587e315ef597234';

async function runTests() {
  console.log('====================================================');
  console.log('STARTING CRM COMMANDS & EMAIL VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  // 1. Get users
  const sanket = await prisma.user.findFirst({ where: { email: 'snket2005d@gmail.com' } });
  const vivek = await prisma.user.findFirst({ where: { email: 'vp983351@gmail.com' } });

  if (!sanket || !vivek) {
    console.error('Users not found in database!');
    process.exit(1);
  }

  console.log(`Sender: ${sanket.name} (${sanket.email}, ID: ${sanket.id})`);
  console.log(`Target Assignee: ${vivek.name} (${vivek.email}, ID: ${vivek.id})`);
  console.log(`Target Project: technewity labs AI Core Team (ID: ${PROJECT_ID})\n`);

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

  const commands = [
    {
      name: 'TEST 1: /task Command',
      content: `/task @bot Implement Core Neural Routing System lead: @VIVEK PANDEY #ai priority: high due: in 3 days\n- Set up dynamic routing\n- Verify latency benchmarks`,
      mentionUserIds: [vivek.id]
    },
    {
      name: 'TEST 2: /bug Command',
      content: `/bug @bot Fix memory leak on WebSocket connection pool lead: @VIVEK PANDEY priority: urgent`,
      mentionUserIds: [vivek.id]
    },
    {
      name: 'TEST 3: /improvement Command',
      content: `/improvement @bot Optimize database connection pooling for real-time CRM lead: @VIVEK PANDEY priority: normal`,
      mentionUserIds: [vivek.id]
    },
    {
      name: 'TEST 4: /email Command',
      content: `/email @bot Send production launch confirmation to vp983351@gmail.com with subject: CRM Platform Ready for Production All systems operational.`,
      mentionUserIds: [vivek.id]
    }
  ];

  for (const cmd of commands) {
    console.log(`----------------------------------------------------`);
    console.log(`Executing: ${cmd.name}`);
    console.log(`Content: "${cmd.content.split('\n')[0]}"`);

    const res = await fetch(`http://localhost:3333/api/project/${PROJECT_ID}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: token,
        refreshtoken: refreshToken
      },
      body: JSON.stringify({
        content: cmd.content,
        mentionUserIds: cmd.mentionUserIds,
        organizationId: ORG_ID,
        projectId: PROJECT_ID
      })
    });

    const data = await res.json();
    console.log(`HTTP Status: ${res.status}`);
    if (data.status !== 200) {
      console.error('FAILED to post message:', data);
      continue;
    }

    const messageId = data.data.id;
    console.log(`Message Created (ID: ${messageId}, Status: ${data.data.status})`);
    console.log('Waiting for AI Bot processing and email dispatch (5 seconds)...');
    await new Promise((r) => setTimeout(r, 5500));

    // Check message status
    const updatedMsg = await prisma.chatMessage.findUnique({ where: { id: messageId } });
    console.log(`Bot Processing Result: Status = ${updatedMsg.status}, Linked Task = ${updatedMsg.linkedTaskId || 'None'}`);

    if (updatedMsg.linkedTaskId) {
      const task = await prisma.task.findUnique({ where: { id: updatedMsg.linkedTaskId } });
      const status = await prisma.taskStatus.findUnique({ where: { id: task.taskStatusId } });
      console.log(` Task Verified in DB:`);
      console.log(`   - Title: "${task.title}"`);
      console.log(`   - Type: ${task.type}`);
      console.log(`   - Status Column: ${status ? status.name : 'Unknown'} (${status ? status.type : ''})`);
      console.log(`   - Assignee IDs: ${task.assigneeIds.join(', ')} (Matches Vivek: ${task.assigneeIds.includes(vivek.id)})`);
      console.log(`   - Priority: ${task.priority}`);
      console.log(`   - Due Date: ${task.dueDate ? task.dueDate.toISOString() : 'None'}`);

      // Check notification
      const notif = await prisma.notification.findFirst({
        where: { userId: vivek.id, organizationId: ORG_ID },
        orderBy: { createdAt: 'desc' }
      });
      if (notif) {
        console.log(`   - In-App Notification: "${notif.title}" (to: ${vivek.email})`);
      }
    }

    // Check bot reply
    const botReply = await prisma.chatMessage.findFirst({
      where: { projectId: PROJECT_ID, isBotReply: true },
      orderBy: { createdAt: 'desc' }
    });
    if (botReply) {
      console.log(`   - Bot Reply: ${botReply.content.replace(/<[^>]*>/g, '')}`);
    }

    console.log(`Command Completed Successfully!\n`);
  }

  console.log('====================================================');
  console.log('ALL COMMAND TESTS COMPLETED');
  console.log('====================================================');
  await prisma.$disconnect();
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
