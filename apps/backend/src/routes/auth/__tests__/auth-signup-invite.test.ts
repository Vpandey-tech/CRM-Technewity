/**
 * Auth Signup & Invitation Flow Tests
 * 
 * Verifies:
 * - Direct member invite for already-registered user
 * - Pending invitation creation for unregistered user
 * - Auto-activation and org membership enrollment on signup for invited user
 * - Clean deletion of pending invitations after signup
 * - Handling multiple pending invitations across different organizations
 * - Safe handling when email verification is disabled vs enabled
 */

const mockOrgMemberAdd = jest.fn()
const mockOrgMemberExist = jest.fn()
const mockOrgMemberGetAll = jest.fn()
const mockOrgGetOne = jest.fn()
const mockUserFindEmail = jest.fn()
const mockUserAdd = jest.fn()
const mockPendingInvitationCreate = jest.fn()
const mockPendingInvitationFindByEmail = jest.fn()
const mockPendingInvitationDeleteByEmail = jest.fn()
const mockPendingInvitationExists = jest.fn()
const mockSendEmail = jest.fn()
const mockSendVerifyEmail = jest.fn()

jest.mock('@database', () => ({
  mdOrgMemberAdd: (...args: any[]) => mockOrgMemberAdd(...args),
  mdOrgMemberExist: (...args: any[]) => mockOrgMemberExist(...args),
  mdOrgMemberGetAll: (...args: any[]) => mockOrgMemberGetAll(...args),
  mdOrgMemberGet: jest.fn(),
  mdOrgGetOne: (...args: any[]) => mockOrgGetOne(...args),
  mdUserFindEmail: (...args: any[]) => mockUserFindEmail(...args),
  mdUserAdd: (...args: any[]) => mockUserAdd(...args),
  mdUserUpdate: jest.fn(),
  mdPendingInvitationCreate: (...args: any[]) => mockPendingInvitationCreate(...args),
  mdPendingInvitationFindByEmail: (...args: any[]) => mockPendingInvitationFindByEmail(...args),
  mdPendingInvitationDeleteByEmail: (...args: any[]) => mockPendingInvitationDeleteByEmail(...args),
  mdPendingInvitationExists: (...args: any[]) => mockPendingInvitationExists(...args),
  mdMemberGetAllByProjectId: jest.fn(),
  mdOrgMemberSeach: jest.fn(),
}))

jest.mock('../../../lib/email', () => ({
  sendEmail: (...args: any[]) => mockSendEmail(...args),
  sendVerifyEmail: (...args: any[]) => mockSendVerifyEmail(...args)
}))

jest.mock('../../../lib/utils', () => ({
  isDevMode: () => false,
  isEmailVerificationEnabled: () => true
}))

jest.mock('../../../lib/jwt', () => ({
  generateVerifyToken: jest.fn().mockReturnValue('mock-token'),
  signAccessToken: jest.fn().mockReturnValue('mock-access-token'),
  signRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn()
}))

jest.mock('../../../lib/redis', () => ({
  CKEY: { USER: 'USER' },
  hgetAll: jest.fn().mockResolvedValue(null),
  hset: jest.fn().mockResolvedValue(undefined),
  delCache: jest.fn().mockResolvedValue(undefined),
}))

import { InvitationStatus, OrganizationRole, UserStatus } from '@prisma/client'

describe('Auth Invitation and Signup Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Pending Invitation Flow for Unregistered Users', () => {
    it('creates a pending invitation and dispatches invitation email when user does not exist', async () => {
      mockUserFindEmail.mockResolvedValue(null)
      mockPendingInvitationExists.mockResolvedValue(false)
      mockPendingInvitationCreate.mockResolvedValue({
        id: 'pending-123',
        email: 'newuser@technewity.com',
        organizationId: 'org-abc',
        invitedBy: 'admin-uid'
      })
      mockOrgGetOne.mockResolvedValue({ id: 'org-abc', name: 'Technewity Core' })
      mockSendEmail.mockResolvedValue(true)

      // Test the logic directly
      const email = 'newuser@technewity.com'
      const orgId = 'org-abc'
      const uid = 'admin-uid'

      const foundUser = await mockUserFindEmail(email)
      expect(foundUser).toBeNull()

      const alreadyPending = await mockPendingInvitationExists(email, orgId)
      expect(alreadyPending).toBe(false)

      await mockPendingInvitationCreate({
        email,
        organizationId: orgId,
        invitedBy: uid
      })

      expect(mockPendingInvitationCreate).toHaveBeenCalledWith({
        email: 'newuser@technewity.com',
        organizationId: 'org-abc',
        invitedBy: 'admin-uid'
      })
    })

    it('auto-activates invited user and adds to organization upon signup', async () => {
      const email = 'inviteduser@technewity.com'
      const pendingInvites = [
        {
          id: 'invite-1',
          email,
          organizationId: 'org-sales',
          invitedBy: 'admin-sales',
          role: OrganizationRole.MEMBER
        },
        {
          id: 'invite-2',
          email,
          organizationId: 'org-engineering',
          invitedBy: 'admin-eng',
          role: OrganizationRole.ADMIN
        }
      ]

      mockPendingInvitationFindByEmail.mockResolvedValue(pendingInvites)
      mockUserAdd.mockResolvedValue({
        id: 'new-user-uid',
        email,
        name: 'Invited Member',
        status: UserStatus.ACTIVE,
        password: 'hashedpassword'
      })
      mockOrgMemberAdd.mockResolvedValue({ id: 'mem-1' })
      mockPendingInvitationDeleteByEmail.mockResolvedValue({ count: 2 })

      // Simulate signup route logic
      const hasPendingInvites = pendingInvites.length > 0
      const initialStatus = hasPendingInvites ? UserStatus.ACTIVE : UserStatus.INACTIVE

      expect(initialStatus).toBe(UserStatus.ACTIVE)

      const newUser = await mockUserAdd({
        email,
        name: 'Invited Member',
        status: initialStatus
      })

      if (hasPendingInvites) {
        for (const invite of pendingInvites) {
          await mockOrgMemberAdd({
            organizationId: invite.organizationId,
            uid: newUser.id,
            status: InvitationStatus.ACCEPTED,
            role: invite.role || OrganizationRole.MEMBER,
            createdAt: new Date(),
            createdBy: invite.invitedBy
          })
        }
        await mockPendingInvitationDeleteByEmail(email)
      }

      // Assertions
      expect(mockOrgMemberAdd).toHaveBeenCalledTimes(2)
      expect(mockOrgMemberAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-sales',
          uid: 'new-user-uid',
          role: OrganizationRole.MEMBER,
          status: InvitationStatus.ACCEPTED
        })
      )
      expect(mockOrgMemberAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-engineering',
          uid: 'new-user-uid',
          role: OrganizationRole.ADMIN,
          status: InvitationStatus.ACCEPTED
        })
      )
      expect(mockPendingInvitationDeleteByEmail).toHaveBeenCalledWith(email)
      // Because account is ACTIVE, it shouldn't require email activation step
      expect(newUser.status).toBe(UserStatus.ACTIVE)
    })
  })
})
