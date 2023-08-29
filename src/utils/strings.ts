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
