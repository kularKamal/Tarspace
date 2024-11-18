import { IconSearch, IconSearchOff, IconZoomExclamation } from "@tabler/icons-react"
import { Card, Col, Divider, Flex, Grid, Icon, Text, TextInput, Title } from "@tremor/react"
import { motion } from "framer-motion"
import { ChangeEvent, KeyboardEvent, MouseEvent, useContext, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { useOnClickOutside } from "usehooks-ts"

import { Spinner } from "components"
import { ScreenOverlay } from "components/ScreenOverlay"
import { AppContext, AuthContext } from "contexts"
import { useDebouncedState, useIndexableData, useLunr, useQueryWildcards } from "hooks"
import { DeliverableDoc } from "types"

const SEARCH_FIELDS = ["name", "project", "artifacts", "repository"]
type SearcheableKeys = "name" | "project" | "artifacts" | "repository"
type SearcheableDeliverable = Pick<DeliverableDoc, SearcheableKeys> & {
  slug: string
}

type SearchResultsProps = {
  queryIsEmpty: boolean
  results: SearcheableDeliverable[]
  loading: boolean
  onClick?: () => void
}

function SearchResults({ queryIsEmpty, results, loading, onClick }: SearchResultsProps) {
  let Content = <SearchNoResultsView />

  if (queryIsEmpty) {
    Content = <SearchEmptyView />
  } else if (results.length !== 0) {
    Content = (
      <>
        {results.map((result, index, array) => (
          <Link
            to={`/deliverables/${result.project.split("@").reverse().join("/")}/${result.name}`}
            key={result.slug + index}
            rel="noopener noreferrer"
            onClick={onClick}
          >
            <Grid numItems={5} className="gap-4">
              <Col numColSpan={2}>
                <Flex flexDirection="col" alignItems="start">
                  <Title className="truncate">{result.name}</Title>
                  <Text>{result.project}</Text>
                </Flex>
              </Col>
              <Col numColSpan={3}>
                <Text>Repo: {result.repository}</Text>
                <Text>Artifacts: {result.artifacts.join(", ")}</Text>
              </Col>
            </Grid>
            {index === array.length - 1 ? null : <Divider />}
          </Link>
        ))}
      </>
    )
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
      animate={{
        opacity: 1,
        transitionEnd: {
          overflow: "visible",
          textOverflow: "clip",
          whiteSpace: "normal",
        },
      }}
    >
      <Card className="z-20 mt-2 mb-32 absolute overflow-y-auto max-h-[80vh]">
        {loading ? (
          <Flex role="status" flexDirection="col" justifyContent="center" alignItems="center" className="h-20">
            <Spinner />
          </Flex>
        ) : (
          Content
        )}
      </Card>
    </motion.div>
  )
}

const SearchEmptyView = () => (
  <Flex className="h-20 space-x-1" justifyContent="center">
    <Icon icon={IconZoomExclamation} size="xl" className="text-tremor-content-subtle" />
    <div>
      <Title>Nothing to find</Title>
      <Text className="mb-1 text-tremor-content-subtle text-center">Start typing to search</Text>
    </div>
  </Flex>
)

const SearchNoResultsView = () => (
  <Flex className="h-20 space-x-1" justifyContent="center">
    <Icon icon={IconSearchOff} size="xl" className="text-tremor-content-subtle" />
    <div>
      <Title>No results</Title>
      <Text className="mb-1 text-tremor-content-subtle text-center">Check your search terms</Text>
    </div>
  </Flex>
)

export function Search() {
  const { username } = useContext(AuthContext)

  const cache = useRef<Record<string, SearcheableDeliverable> | null>(null)
  const [deliverables, setDeliverables] = useState<Record<string, SearcheableDeliverable>>({})
  const [query, setQuery] = useDebouncedState<string>("", 100)
  const queryFn = useQueryWildcards(query)

  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(true)

  const lunrIndexConfig = useIndexableData(Object.values(deliverables), "slug", SEARCH_FIELDS)
  const results = useLunr(queryFn, lunrIndexConfig)

  const resultsRef = useRef(null)
  useOnClickOutside(resultsRef, () => {
    if (showResults) {
      setShowResults(false)
    }
  })

  async function fetchDeliverables() {
    // if (userDb === undefined || username === undefined) {
    //   return
    // }
    // if (cache.current) {
    //   setDeliverables(cache.current)
    //   return
    // }
    // await CouchdbClient.db(userDb)
    //   .design(username)
    //   .view("deliverables-search", {
    //     reduce: true,
    //     group: true,
    //   })
    //   .then(resp => {
    //     const map: Record<string, SearcheableDeliverable> = {}
    //     resp.rows.forEach(row => {
    //       const value = row.value as SearcheableDeliverable
    //       const path = value.slug
    //       map[path] = value
    //     })
    //     setDeliverables(map)
    //     cache.current = map
    //     setLoading(false)
    //   })
  }

  function handleQueryChange(event: ChangeEvent<HTMLInputElement>) {
    if (!showResults) {
      setShowResults(true)
    }
    setQuery(event.target.value.trim())
  }

  function handleKeyPress(event: KeyboardEvent<HTMLInputElement>) {
    if (showResults && event.key === "Escape") {
      setShowResults(false)
      if (document.activeElement && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    }
  }

  function handleClick(event: MouseEvent<HTMLInputElement>) {
    if (!showResults) {
      event.currentTarget.select()
      setShowResults(true)
    }
    fetchDeliverables()
  }

  return (
    <motion.div
      animate={{
        width: showResults ? "100%" : "60%",
      }}
    >
      <Flex flexDirection="col" justifyContent="around">
        {showResults ? <ScreenOverlay /> : null}
        <form className="w-full z-30" onSubmit={e => e.preventDefault()}>
          <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only">
            Search
          </label>
          <div className="relative" ref={resultsRef}>
            <TextInput
              type="text"
              id="default-search"
              className={`focus:outline-none focus:ring-0 focus:ring-offset-0 ${
                showResults ? "bg-tremor-background" : "bg-tremor-background-muted"
              }`}
              placeholder="Search..."
              autoComplete="off"
              autoCorrect="off"
              icon={IconSearch}
              onClick={handleClick}
              onChange={handleQueryChange}
              onKeyUp={handleKeyPress}
            />
            {showResults ? (
              <SearchResults
                queryIsEmpty={query === ""}
                results={results.map(result => deliverables[result.ref])}
                loading={loading}
                onClick={() => setShowResults(false)}
              />
            ) : null}
          </div>
        </form>
      </Flex>
    </motion.div>
  )
}
