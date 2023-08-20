import { Logger } from "@iotinga/ts-backpack-common"
import React from "react"
import ReactDOM from "react-dom/client"
import { Route, RouterProvider, createHashRouter, createRoutesFromElements } from "react-router-dom"

import App from "app/App"
import { Deliverable } from "app/deliverable/index"
import Layout from "app/layout"
import { Login } from "app/login/index"

import { ProtectedRoute } from "components/ProtectedRoute"
import { AppContextProvider } from "contexts/AppContext"
import { AuthContextProvider } from "contexts/AuthContext"
import "./index.css"

const logger = new Logger("App")

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
          <Route path=":customer/:project/:deliverable" element={<Deliverable />} />
        </Route>
      </Route>
    </>
  )
)

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement)
root.render(
  <React.StrictMode>
    <AppContextProvider>
      <AuthContextProvider>
        <RouterProvider router={router} />
      </AuthContextProvider>
    </AppContextProvider>
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals(logger.debug)
