import { Logger } from "@iotinga/ts-backpack-common"
import React, { Suspense, lazy } from "react"
import ReactDOM from "react-dom/client"
import { Navigate, Route, RouterProvider, createHashRouter, createRoutesFromElements } from "react-router-dom"

import Layout from "app/layout"
import { NotFoundPage } from "components/NotFound"
import { ProtectedRoute } from "components/ProtectedRoute"
import { AppContextProvider, AuthContextProvider } from "contexts"
import "./index.css"

const App = lazy(() => import("app/App"))
const Deliverable = lazy(() => import("app/deliverable"))
const Login = lazy(() => import("app/login"))

const router = createHashRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="" element={<App />} />
        <Route path="deliverables">
          <Route path=":customer" element={<App />} />
          <Route path=":customer/:project" element={<App />} />
          <Route path=":customer/:project/:deliverable" element={<Navigate to="details" replace />} />
          <Route path=":customer/:project/:deliverable/:tab" element={<Deliverable />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />}></Route>
    </>
  )
)

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement)
root.render(
  <React.StrictMode>
    <AppContextProvider>
      <AuthContextProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <RouterProvider router={router} />
        </Suspense>
      </AuthContextProvider>
    </AppContextProvider>
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals(logger.debug)
