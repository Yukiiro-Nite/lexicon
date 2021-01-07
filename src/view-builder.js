
function buildViewFiles (dictionarySchema) {
  const pages = buildWordPages(dictionarySchema)
  const indexPage = { fileName: 'index.html', content: buildIndexPage(dictionarySchema) }

  pages.push(indexPage)

  return pages
}

function buildWordPages (dictionarySchema) {
  return Object.entries(dictionarySchema.dictionary)
    .map(([key, dictionaryEntries]) => ({
      fileName: `${toSafeName(key)}.html`,
      content: buildWordPage(key, dictionaryEntries, dictionarySchema.name)
    }))
}

function buildIndexPage (dictionarySchema) {
  return `<html>
  <head>
    <title>${dictionarySchema.name}</title>
  </head>
  <body>
    Index
    More coming soon!
  </body>
</html>
`
}

function toSafeName (name) {
  // TODO: return a safe file / path / url name here...
  return name
}

function buildWordPage (word, entries, dictionaryName) {
  return `<html>
  <head>
    <title>${dictionaryName} - ${word}</title>
  </head>
  <body>
    ${word}
    More coming soon!
  </body>
</html>
`
}




// ================================================================================================
// stuff for using this script with node.
if(require && module) {
  function buildViewCLI () {
    const [jsonFile, outputPath] = process.argv.slice(2)
    const path = require('path')
    const jsonPath = path.resolve(process.cwd(), jsonFile)
  
    // write some guards here later, files might not exist.
  
    const dictionaryJson = require(jsonPath)
    const files = buildViewFiles(dictionaryJson)
  
    exportViewToFolder(files, outputPath)

    console.log(`Files built from schema at: ${jsonPath}`)
    console.log(`Run this to see your pages:\n\tnpx http-serve ${outputPath}\n`)
  }
  
  function exportViewToFolder (viewFiles, outputPath) {
    const fs = require('fs')
    const path = require('path')
    const dir = path.resolve(process.cwd(), outputPath)
  
    viewFiles.forEach(file => {
      fs.writeFileSync(path.join(dir, file.fileName), file.content)
    })
  }
  
  if (require.main === module) {
    buildViewCLI()
  }

  module.exports = {
    buildViewFiles,
    exportViewToFolder
  }
}