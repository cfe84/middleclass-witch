const fs = require("fs")
const path = require("path")

const folder = process.argv[2]

function listAllMdFiles(folder) {
  const folderContent = fs.readdirSync(folder)
  let res = []
  for (const fileOrFolder of folderContent) {
    const fullPath = path.join(folder, fileOrFolder)
    if (fs.lstatSync(fullPath).isDirectory()) {
      res = [...res, ...listAllMdFiles(fullPath)]
    } else if (path.extname(fileOrFolder) === ".md") {
      res = [...res, fullPath]
    }
  }
  return res
}

for (const file of listAllMdFiles(folder)) {
  console.log(file)
}