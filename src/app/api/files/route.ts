import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { execSync } from "child_process"

const ROOT = "/home/ubuntu"

function safePath(p: string): string {
  const resolved = path.resolve(ROOT, p || ".")
  if (!resolved.startsWith(ROOT)) return ROOT
  return resolved
}

function getFileIcon(name: string, isDir: boolean): string {
  if (isDir) return "folder"
  const ext = path.extname(name).toLowerCase()
  if ([".js", ".ts", ".tsx", ".jsx", ".mjs"].includes(ext)) return "code"
  if ([".json", ".yaml", ".yml", ".toml"].includes(ext)) return "config"
  if ([".md", ".txt", ".log", ".csv"].includes(ext)) return "text"
  if ([".html", ".css", ".scss"].includes(ext)) return "web"
  if ([".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"].includes(ext)) return "image"
  if ([".pdf", ".doc", ".docx"].includes(ext)) return "document"
  if ([".sh", ".bash", ".zsh"].includes(ext)) return "script"
  if ([".py"].includes(ext)) return "python"
  if ([".env"].includes(ext)) return "env"
  return "file"
}

function isTextFile(name: string): boolean {
  const textExts = [
    ".js", ".ts", ".tsx", ".jsx", ".mjs", ".json", ".yaml", ".yml", ".toml",
    ".md", ".txt", ".log", ".csv", ".html", ".css", ".scss", ".sh", ".bash",
    ".zsh", ".py", ".env", ".cfg", ".conf", ".ini", ".xml", ".svg", ".service",
    ".gitignore", ".dockerignore", ".editorconfig", ".prettierrc", ".eslintrc",
  ]
  const ext = path.extname(name).toLowerCase()
  const base = path.basename(name)
  // Files without extension or known text basenames
  if (["Makefile", "Dockerfile", "LICENSE", "README", "AGENTS.md", "SOUL.md", "CLAUDE.md", "Caddyfile"].includes(base)) return true
  if (!ext) return true // assume files without extension are text
  return textExts.includes(ext)
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const rawPath = url.searchParams.get("path") || "."
  const action = url.searchParams.get("action") || "list"
  const fullPath = safePath(rawPath)

  try {
    if (action === "read") {
      // Read file content
      if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
        return NextResponse.json({ error: "Not a file" }, { status: 400 })
      }
      const stat = fs.statSync(fullPath)
      if (stat.size > 2 * 1024 * 1024) {
        return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 })
      }
      const content = fs.readFileSync(fullPath, "utf-8")
      return NextResponse.json({
        path: fullPath,
        name: path.basename(fullPath),
        content,
        size: stat.size,
        modified: stat.mtime.toISOString(),
        editable: isTextFile(path.basename(fullPath)),
      })
    }

    if (action === "download") {
      if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
        return NextResponse.json({ error: "Not a file" }, { status: 400 })
      }
      const content = fs.readFileSync(fullPath)
      return new NextResponse(content, {
        headers: {
          "Content-Disposition": `attachment; filename="${path.basename(fullPath)}"`,
          "Content-Type": "application/octet-stream",
        },
      })
    }

    if (action === "search") {
      const query = url.searchParams.get("q") || ""
      if (!query) return NextResponse.json({ results: [] })
      try {
        const results = execSync(
          `find ${fullPath} -maxdepth 4 -name "*${query.replace(/[^a-zA-Z0-9._-]/g, "")}*" 2>/dev/null | head -50`,
          { timeout: 10000 }
        ).toString().trim().split("\n").filter(Boolean)
        return NextResponse.json({
          results: results.map(r => ({
            path: r,
            name: path.basename(r),
            relative: path.relative(ROOT, r),
            isDir: fs.existsSync(r) && fs.statSync(r).isDirectory(),
          })),
        })
      } catch {
        return NextResponse.json({ results: [] })
      }
    }

    // Default: list directory
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "Path not found" }, { status: 404 })
    }

    const stat = fs.statSync(fullPath)
    if (!stat.isDirectory()) {
      return NextResponse.json({ error: "Not a directory" }, { status: 400 })
    }

    const entries = fs.readdirSync(fullPath, { withFileTypes: true })
    const items = entries
      .filter(e => !e.name.startsWith(".") || e.name === ".openclaw" || e.name === ".env")
      .map(e => {
        const itemPath = path.join(fullPath, e.name)
        try {
          const s = fs.statSync(itemPath)
          return {
            name: e.name,
            path: itemPath,
            relative: path.relative(ROOT, itemPath),
            isDir: e.isDirectory(),
            size: e.isDirectory() ? 0 : s.size,
            modified: s.mtime.toISOString(),
            icon: getFileIcon(e.name, e.isDirectory()),
            editable: !e.isDirectory() && isTextFile(e.name),
          }
        } catch {
          return null
        }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => {
        if (a.isDir && !b.isDir) return -1
        if (!a.isDir && b.isDir) return 1
        return a.name.localeCompare(b.name)
      })

    // Breadcrumbs
    const relative = path.relative(ROOT, fullPath)
    const parts = relative ? relative.split(path.sep) : []
    const breadcrumbs = [{ name: "~", path: ROOT }]
    let current = ROOT
    for (const part of parts) {
      current = path.join(current, part)
      breadcrumbs.push({ name: part, path: current })
    }

    return NextResponse.json({
      path: fullPath,
      relative,
      breadcrumbs,
      items,
      parent: fullPath === ROOT ? null : path.dirname(fullPath),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || ""

    // Handle file upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData()
      const file = formData.get("file") as File | null
      const targetDir = formData.get("path") as string || "."

      if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

      const dirPath = safePath(targetDir)
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }

      const filePath = path.join(dirPath, file.name)
      const buffer = Buffer.from(await file.arrayBuffer())
      fs.writeFileSync(filePath, buffer)

      return NextResponse.json({ ok: true, path: filePath })
    }

    // Handle JSON actions
    const body = await req.json()
    const { action } = body

    if (action === "write") {
      const filePath = safePath(body.path)
      const dir = path.dirname(filePath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(filePath, body.content, "utf-8")
      return NextResponse.json({ ok: true })
    }

    if (action === "mkdir") {
      const dirPath = safePath(body.path)
      fs.mkdirSync(dirPath, { recursive: true })
      return NextResponse.json({ ok: true })
    }

    if (action === "delete") {
      const targetPath = safePath(body.path)
      if (targetPath === ROOT) return NextResponse.json({ error: "Cannot delete root" }, { status: 400 })
      if (fs.statSync(targetPath).isDirectory()) {
        fs.rmSync(targetPath, { recursive: true, force: true })
      } else {
        fs.unlinkSync(targetPath)
      }
      return NextResponse.json({ ok: true })
    }

    if (action === "rename") {
      const oldPath = safePath(body.oldPath)
      const newPath = safePath(body.newPath)
      fs.renameSync(oldPath, newPath)
      return NextResponse.json({ ok: true })
    }

    if (action === "create") {
      const filePath = safePath(body.path)
      const dir = path.dirname(filePath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(filePath, body.content || "", "utf-8")
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
