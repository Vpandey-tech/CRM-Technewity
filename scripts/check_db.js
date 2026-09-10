require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany();
  console.log('ORGS:', JSON.stringify(orgs.map(o => ({ id: o.id, name: o.name, slug: o.slug }))));
  
  const projects = await prisma.project.findMany();
  console.log('PROJECTS:', JSON.stringify(projects.map(p => ({ id: p.id, name: p.name, orgId: p.organizationId, projectViewId: p.projectViewId }))));
  
  const projectViews = await prisma.projectView.findMany();
  console.log('PROJECT VIEWS:', JSON.stringify(projectViews.map(pv => ({ id: pv.id, name: pv.name, type: pv.type, projectId: pv.projectId }))));

  const statuses = await prisma.taskStatus.findMany();
  console.log('STATUSES:', JSON.stringify(statuses.map(s => ({ id: s.id, name: s.name, projectId: s.projectId, order: s.order }))));
  
  const tasks = await prisma.task.findMany();
  console.log('TASKS COUNT:', tasks.length);
  const members = await prisma.members.findMany();
  console.log('MEMBERS:', JSON.stringify(members));
  const orgMembers = await prisma.organizationMember.findMany();
  console.log('ORG MEMBERS:', JSON.stringify(orgMembers));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
