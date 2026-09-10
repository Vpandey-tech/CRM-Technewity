import { ReactNode } from 'react'
import { useUserRole } from './useUserRole'
import { MemberRole } from '@prisma/client'

interface IHasRole {
  children: ReactNode
  projectRoles: MemberRole | MemberRole[]
}

export default function HasRole({ children, projectRoles }: IHasRole) {
  const { projectRole, orgRole } = useUserRole()

  if (orgRole === 'ADMIN' || orgRole === 'MANAGER') {
    return <>{children}</>
  }

  if (projectRole && projectRoles.includes(projectRole)) {
    return <>{children}</>
  }

  return <></>
}
