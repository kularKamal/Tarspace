import React from "react"
import ReactDOM from "react-dom/client"
import { Route, RouterProvider, Routes, createHashRouter, createRoutesFromElements } from "react-router-dom"

import App from "./app/App"
import { Depot } from "./app/depot/index"
import { Login } from "./app/login/index"
import { Project } from "./app/project"
import reportWebVitals from "./reportWebVitals"

import "./index.css"

const router = createHashRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<App />} />
      <Route path="/depot" element={<Depot />} />
      <Route path="/login" element={<Login />} />
      <Route path="/projects/:project" element={<Project />} />
    </>
  )
)

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement)
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
