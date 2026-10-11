export interface ParsedDependency {
  name: string
  declaredVersion: string
}

/**
 * Client-side preview only — reads package.json in the browser just to show
 * "found N dependencies" before the file is uploaded. The real parsing (and
 * version resolution) happens on the backend (app/services/parser.py) when
 * the file is actually submitted to POST /scan.
 *
 * Only package.json is supported for now: the backend's scanner doesn't
 * parse package-lock.json or requirements.txt yet.
 */
export async function previewPackageJson(file: File): Promise<ParsedDependency[]> {
  if (file.name.toLowerCase() !== 'package.json') {
    throw new Error('PatchWatch currently only scans package.json files.')
  }

  const text = await file.text()
  let json: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }

  const combined = { ...json.dependencies, ...json.devDependencies }
  return Object.entries(combined).map(([name, declaredVersion]) => ({ name, declaredVersion }))
}
