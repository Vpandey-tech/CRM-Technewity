import { pmClient } from './_prisma'

export const mdPendingInvitationCreate = async (data: {
  email: string
  organizationId: string
  invitedBy: string
}) => {
  return pmClient.pendingInvitation.create({
    data: {
      email: data.email,
      organizationId: data.organizationId,
      invitedBy: data.invitedBy
    }
  })
}

export const mdPendingInvitationFindByEmail = async (email: string) => {
  return pmClient.pendingInvitation.findMany({
    where: { email }
  })
}

export const mdPendingInvitationDeleteByEmail = async (email: string) => {
  return pmClient.pendingInvitation.deleteMany({
    where: { email }
  })
}

export const mdPendingInvitationExists = async (email: string, organizationId: string) => {
  const result = await pmClient.pendingInvitation.findFirst({
    where: { email, organizationId }
  })
  return !!result
}
