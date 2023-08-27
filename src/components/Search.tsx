import { IconSearch, IconSearchOff, IconZoomExclamation } from "@tabler/icons-react"
import { Button, Card, Col, Divider, Flex, Grid, Text, TextInput, Title } from "@tremor/react"
import { FC, useContext, useRef, useState } from "react"
import { Link } from "react-router-dom"

import { Spinner } from "components"
import { AppContext, AuthContext } from "contexts"
import { useClickAway, useDebounce, useIndexableData, useLunr, useQueryWildcards } from "hooks"
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
}

const SearchResults: FC<SearchResultsProps> = ({ queryIsEmpty, results, loading }) => {
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
          >
            <Grid numItems={5} className="gap-4">
              <Col numColSpan={2}>
                <Flex flexDirection="col" alignItems="start">
                  <Title>{result.name}</Title>
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
    <Card className="z-20 mt-2 mb-32 absolute overflow-y-auto max-h-[80vh]">
      {loading ? (
        <Flex role="status" flexDirection="col" justifyContent="center" alignItems="center" className="h-20">
          <Spinner />
        </Flex>
      ) : (
        Content
      )}
    </Card>
  )
}

const SearchEmptyView = () => (
  <Flex className="h-20" justifyContent="center">
    <IconZoomExclamation size={32} stroke={1} className="text-tremor-content-subtle" />
    <Text className="ml-3 mb-1 text-tremor-content-subtle text-center">Start typing to search</Text>
  </Flex>
)

const SearchNoResultsView = () => (
  <Flex className="h-20" justifyContent="center">
    <IconSearchOff size={32} stroke={1} className="text-tremor-content-subtle" />
    <Text className="ml-3 mb-1 text-tremor-content-subtle text-center">No results found</Text>
  </Flex>
)

export const Search: FC = () => {
  const { CouchdbManager } = useContext(AppContext)
  const { userDb, username } = useContext(AuthContext)

  const [deliverables, setDeliverables] = useState<Record<string, SearcheableDeliverable>>({})
  const [query, setQuery] = useState<string>("")
  const debouncedQuery = useDebounce(query, 300)
  const queryFn = useQueryWildcards(debouncedQuery)

  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(true)

  const lunrIndexConfig = useIndexableData(Object.values(deliverables), "slug", SEARCH_FIELDS)
  const results = useLunr(queryFn, lunrIndexConfig)

  const resultsRef = useRef(null)
  useClickAway(() => {
    if (showResults) {
      setShowResults(false)
    }
  }, resultsRef)

  async function fetchDeliverables() {
    if (userDb === undefined || username === undefined) {
      return
    }

    await CouchdbManager.db(userDb)
      .design(username)
      .view("deliverables-search", {
        reduce: true,
        group: true,
      })
      .then(resp => {
        const map: Record<string, SearcheableDeliverable> = {}
        resp.rows
          // .filter(row => row.value !== undefined)
          .forEach(row => {
            const value = row.value as SearcheableDeliverable
            const path = value.slug
            map[path] = value
          })
        setDeliverables(map)
        setLoading(false)
      })
  }

  return (
    <div
      style={{
        transition: "width ease 400ms",
        width: showResults ? "50%" : undefined,
      }}
    >
      <Flex flexDirection="col" justifyContent="around">
        <form
          className="w-full z-20"
          onSubmit={e => e.preventDefault()}
          style={{
            transition: "width ease 400ms",
          }}
        >
          <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only">
            Search
          </label>
          <div className="relative" ref={resultsRef}>
            <TextInput
              type="text"
              id="default-search"
              className="z-20 bg-tremor-background-muted focus:outline-none focus:ring-0 focus:ring-offset-0"
              placeholder="Search..."
              autoComplete="off"
              autoCorrect="off"
              icon={IconSearch}
              onClickCapture={() => {
                if (!showResults) {
                  setShowResults(true)
                }
                fetchDeliverables()
              }}
              onChange={e => {
                if (!showResults) {
                  setShowResults(true)
                }
                setQuery(e.target.value)
              }}
              required
            />
            <Button type="submit" variant="light" className="absolute right-2.5 bottom-2 font-medium py-2"></Button>
            {showResults ? (
              <SearchResults
                queryIsEmpty={query === ""}
                results={results.map(result => deliverables[result.ref])}
                loading={loading}
              />
            ) : null}
          </div>
        </form>
        {showResults ? <SearchOverlay /> : null}
      </Flex>
    </div>
  )
}

const SearchOverlay: FC = () => (
  <div
    className="w-full h-full fixed top-0 left-0 z-10 pointer-events-none"
    style={{
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      transition: "opacity ease 400ms, width 0s, height 0s",
    }}
  ></div>
)
