import { IconSearch } from "@tabler/icons-react"
import { Button, Flex } from "@tremor/react"
import useClickAway from "hooks/useClickAway"
import { useLunr } from "hooks/useLunr"
import { Index } from "lunr"
import { FC, useReducer, useRef, useState } from "react"

type SearchOverlayProps = {
  results: Index.Result[]
}

const SearchResults: FC<SearchOverlayProps> = ({ results }) => (
  <div className="z-20">
    {results.map((result, index) => (
      <span key={index}>{result.ref}</span>
    ))}
  </div>
)

export const Search: FC = () => {
  const [query, setQuery] = useState<string>("")
  const [showResults, toggleShowResults] = useReducer(bool => !bool, false)
  const results = useLunr(query)

  const resultsRef = useRef(null)
  useClickAway(resultsRef, () => {
    if (showResults) {
      toggleShowResults()
    }
  })

  return (
    <div className={`${showResults && "w-1/2"}`}>
      <Flex flexDirection="col" justifyContent="around">
        <form className="w-full z-20" onSubmit={e => e.preventDefault()}>
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
              className="z-20 block w-full p-2 pl-12 text-tremor-content-strong border border-tremor-border rounded-lg bg-tremor-background-muted"
              placeholder="Search..."
              autoComplete="off"
              autoCorrect="off"
              onFocus={toggleShowResults}
              onChange={e => setQuery(e.target.value)}
              required
            />
            <Button type="submit" variant="light" className="absolute right-2.5 bottom-2 font-medium py-2"></Button>
            {showResults ? <SearchResults results={results} /> : null}
          </div>
        </form>
        {showResults ? <SearchOverlay /> : null}
      </Flex>
    </div>
  )
}

export const SearchOverlay: FC = () => (
  <div
    className="w-full h-full fixed top-0 left-0 z-10"
    style={{ backgroundColor: "rgba(0, 0, 0, 0.3)", transition: "opacity ease 400ms, width 0s, height 0s" }}
  ></div>
)
