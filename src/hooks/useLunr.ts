import { Logger } from "@iotinga/ts-backpack-common"
import lunr, { ConfigFunction, Index, Query } from "lunr"
import { useMemo } from "react"

const logger = new Logger("Search - Lunr")

type Store<T> = Record<string | number | symbol, T>

export const useLunrWithStore = <T = unknown>(
  query?: string | Index.QueryBuilder,
  rawIndex?: Index | object | string,
  rawStore?: Store<T> | string
) => {
  const index = useMemo(() => {
    if (rawIndex === undefined || rawIndex === null) {
      logger.warn("No index was provided. Results will always be empty.")
      return
    }
    if (rawIndex instanceof Index) {
      return rawIndex
    }
    if (typeof rawIndex === "string") {
      return Index.load(JSON.parse(rawIndex))
    }
    if (typeof rawIndex === "object") {
      return Index.load(rawIndex)
    }

    logger.error("Invalid index provided. Please provide an instance of Lunr.Index or exported JSON or string index.")
  }, [rawIndex])

  const store = useMemo(() => {
    if (typeof rawStore === "string") {
      return JSON.parse(rawStore) as Store<T>
    }

    return rawStore
  }, [rawStore])

  return useMemo(() => {
    if (!query || !index) {
      return []
    }

    const results = typeof query === "string" ? index.search(query) : index.query(query)

    if (store) {
      return results.map(({ ref }) => store[ref])
    }

    return results
  }, [query, index, store])
}

export const useLunrWithIndex = (query?: string | Index.QueryBuilder, rawIndex?: Index | object | string) =>
  useLunrWithStore(query, rawIndex) as Index.Result[]

export const useLunr = (query: string | Index.QueryBuilder, config: ConfigFunction) =>
  useLunrWithIndex(query, lunr(config))

export const useIndexableData =
  <T extends object>(data: T[], ref: string, fields: string[]): ConfigFunction =>
  builder => {
    builder.ref(ref)
    fields.forEach(field => builder.field(field))
    data.forEach(doc => builder.add(doc), builder)
  }

export const useQueryWildcards =
  (query: string, sep?: string): Index.QueryBuilder =>
  queryBuilder =>
    query.split(sep ? sep : " ").forEach(term => {
      queryBuilder.term(term, { wildcard: Query.wildcard.LEADING | Query.wildcard.TRAILING })
      queryBuilder.term(term, { wildcard: Query.wildcard.TRAILING })
      queryBuilder.term(term, { wildcard: Query.wildcard.LEADING })
    })
