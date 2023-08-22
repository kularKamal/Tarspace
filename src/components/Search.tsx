import { IconSearch, IconSearchOff, IconZoomExclamation } from "@tabler/icons-react"
import { Button, Card, Divider, Flex, Text } from "@tremor/react"
import lunr, { Index } from "lunr"
import { FC, useContext, useReducer, useRef, useState } from "react"

import useClickAway from "hooks/useClickAway"
import { useLunr } from "hooks/useLunr"
import { Spinner } from "components/Spinner"
import { AppContext } from "contexts/AppContext"
import { AuthContext } from "contexts/AuthContext"
import { DeliverableDoc } from "types/couchdb"

type SearchResultsProps = {
  queryIsEmpty: boolean
  results: Index.Result[]
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
          <>
            <div key={result.ref}>
              <span>{result.ref}</span>
            </div>
            {index === array.length - 1 ? null : <Divider />}
          </>
        ))}
      </>
    )
  }

  return (
    <Card className="z-20 mt-2 absolute">
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

  const [deliverables, setDeliverables] = useState<DeliverableDoc[]>([])
  const [query, setQuery] = useState<string>("")
  const [showResults, toggleShowResults] = useReducer(bool => !bool, false)
  const [loading, setLoading] = useState(true)

  const index = lunr(builder => {
    builder.ref("_id")
    builder.field("name")
    builder.field("project")
    builder.field("version")
    builder.field("artifacts")
    builder.field("repository")

    deliverables.forEach(doc => builder.add(doc), builder)
  })
  const results = useLunr(query, index)

  const resultsRef = useRef(null)
  useClickAway(resultsRef, () => {
    if (showResults) {
      toggleShowResults()
    }
  })

  async function fetchDeliverables() {
    if (userDb === undefined || username === undefined) {
      return
    }

    await CouchdbManager.db(userDb)
      .design(username)
      .view("deliverables", {
        reduce: false,
        include_docs: true,
      })
      .then(resp => {
        setDeliverables(resp.rows.filter(row => row.doc !== undefined).map(row => row.doc) as DeliverableDoc[])
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
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <IconSearch size={22} />
            </div>
            <input
              type="search"
              id="default-search"
              className="z-20 block w-full p-2 pl-12 text-tremor-content-strong border border-tremor-border rounded-lg bg-tremor-background-muted focus:outline-none focus:ring-0 focus:ring-offset-0"
              placeholder="Search..."
              autoComplete="off"
              autoCorrect="off"
              onFocus={() => {
                toggleShowResults()
                fetchDeliverables()
              }}
              onChange={e => setQuery(e.target.value)}
              required
            />
            <Button type="submit" variant="light" className="absolute right-2.5 bottom-2 font-medium py-2"></Button>
            {showResults ? <SearchResults queryIsEmpty={query === ""} results={results} loading={loading} /> : null}
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
