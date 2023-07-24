import { Link } from "react-router-dom"

type BreadcrumbsElement = {
  name: string
  route: string
}

const Chevron = () => (
  <svg
    className="w-3 h-3 text-gray-400 mx-1"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 6 10"
  >
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
  </svg>
)

const Breadcrumbs = (props: { crumbs: BreadcrumbsElement[]; className?: string }) => {
  const last_crumb = props.crumbs.at(-1)

  return (
    <nav className={props.className} aria-label="breadcrumb">
      <ol className="inline-flex items-center space-x-4 py-2">
        <li className="inline-flex items-center">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
          >
            <svg
              className="w-3 h-3 mr-2.5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
            </svg>
            Home
          </Link>
        </li>
        {props.crumbs.slice(0, -1).map((crumb, index) => (
          <li key={index} className="inline-flex items-center space-x-4">
            <span className="text-gray-400">/</span>
            <Link
              to={crumb.route}
              className="text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
            >
              {crumb.name}
            </Link>
          </li>
        ))}
        {last_crumb && (
          <li aria-current="page" className="inline-flex items-center space-x-4">
            <span className="text-gray-400">/</span>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{last_crumb.name}</span>
          </li>
        )}
      </ol>
    </nav>
  )
}

export default Breadcrumbs
