import { RouterProvider } from "react-router-dom"
import router from "./pages/routes"
import "./index.css"
import { BreadcrumbProvider } from "./context/BreadcrumbContext"

function App() {
  return (
    <BreadcrumbProvider>
      <div className="h-screen w-full">
        <RouterProvider router={router} />
      </div>
    </BreadcrumbProvider>
  )
}

export default App
