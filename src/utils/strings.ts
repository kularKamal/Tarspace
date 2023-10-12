export function humanizeFileSize(bytes: number) {
  let unit = 0
  const unitChange = 1024

  while (bytes >= unitChange || -bytes >= unitChange) {
    bytes /= unitChange
    unit++
  }
  return (unit ? bytes.toFixed(1) + " " : bytes) + " KMGTPEZY"[unit] + "B"
}

export function titlecase(str: string) {
  return str
    .split(" ")
    .map(w => w[0].toUpperCase() + w.substring(1).toLowerCase())
    .join(" ")
}

export function semverCompare(a: string, b: string) {
  // From https://gist.github.com/iwill/a83038623ba4fef6abb9efca87ae9ccb

  if (a.startsWith(b + "-")) {
    return -1
  }
  if (b.startsWith(a + "-")) {
    return 1
  }
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "case", caseFirst: "upper" })
}
