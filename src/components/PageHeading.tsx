import { Flex, Metric } from "@tremor/react"
import { Link, useLocation } from "react-router-dom"

export type BreadcrumbsElement = {
  name: string
  route: string
}

type CrumbOverrides = {
  [key: string]: string | null
}

const crumbOverrides: CrumbOverrides = {
  deliverables: null,
}

const IconHome = () => (
  <svg
    className="w-3 h-3 mr-2.5"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
  </svg>
)

type BreadcrumbsProps = {
  crumbs?: BreadcrumbsElement[]
  className?: string
  ignoreLast?: boolean
}

export function Breadcrumbs(props: BreadcrumbsProps) {
  const location = useLocation()

  const crumbs: BreadcrumbsElement[] =
    props.crumbs ||
    location.pathname
      .split("/")
      .filter(piece => piece.length > 0)
      .map((piece, index, array) => {
        if (crumbOverrides[piece] === null) {
          return null
        }

        return {
          name: crumbOverrides[piece] || piece,
          route: "/" + array.slice(0, index + 1).join("/"),
        } as BreadcrumbsElement
      })
      .filter((crumb): crumb is BreadcrumbsElement => crumb !== null && crumb !== undefined)

  if (props.ignoreLast) {
    crumbs.pop()
  }

  const last_crumb = crumbs.at(-1)

  return (
    <nav className={props.className} aria-label="breadcrumb">
      <ol className="inline-flex items-center space-x-4 py-2">
        <li className="inline-flex items-center">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
          >
            <IconHome />
            Home
          </Link>
        </li>
        {crumbs.slice(0, -1).map((crumb, index) => (
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

export type PageHeadingProps = BreadcrumbsProps & {
  title: string
  hideBreadcrumbs?: boolean
}

export function PageHeading(props: PageHeadingProps) {
  const { title, hideBreadcrumbs = false, ...breadcrumProps } = props

  return (
    <Flex flexDirection="col" alignItems="start" className="space-y-4 mb-8">
      {!hideBreadcrumbs && <Breadcrumbs {...breadcrumProps} />}
      <Metric className="text-left">{title}</Metric>
    </Flex>
  )
}
