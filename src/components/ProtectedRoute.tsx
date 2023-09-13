import { CouchdbUserCtx } from "@iotinga/ts-backpack-couchdb-client"
import { ReactElement, useContext, useEffect, useReducer, useState } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"

import { Loading } from "components"
import { AuthContext } from "contexts"
import { LocationState } from "types"

export type ProtectedRouteProps = {
  children: ReactElement
}

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
    return <Loading />
  }

  if (userCtx === undefined) {
    return <Navigate to="login" replace state={{ from: location } as LocationState} />
  }

  return <>{props.children}</> || <Outlet />
}
