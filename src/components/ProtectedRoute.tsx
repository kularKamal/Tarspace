import { CouchdbUserCtx } from "@iotinga/ts-backpack-couchdb-client"
import { PropsWithChildren, useContext, useEffect, useReducer, useState } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"

import { AuthContext } from "contexts"
import { LocationState } from "types"

export type ProtectedRouteProps = PropsWithChildren

export function ProtectedRoute(props: ProtectedRouteProps) {
  const { getSessionInfo } = useContext(AuthContext)
  const location = useLocation()

  const [userCtx, setUserCtx] = useState<CouchdbUserCtx>()
  const [loaded, toggleLoaded] = useReducer(_ => true, false)

  useEffect(() => {
    getSessionInfo()
      .then(resp => {
        if (resp.userCtx?.name) {
          setUserCtx(resp.userCtx)
        }
      })
      .finally(() => toggleLoaded())
  }, [getSessionInfo])

  if (!loaded) {
    return <div>Logging in...</div>
  }

  if (userCtx === undefined) {
    return <Navigate to="login" replace state={{ from: location } as LocationState} />
  }

  return <>{props.children}</> || <Outlet />
}
