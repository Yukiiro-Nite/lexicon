
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
  const byLetter = groupByLetter(dictionarySchema.dictionary)
  const byTag = groupByTag(dictionarySchema.dictionary)

  return `<html>
  <head>
    <title>${dictionarySchema.name}</title>
  </head>
  <body>
    <h1 class="dictionary-name">${dictionarySchema.name}</h1>
    <p class="dictionary-description">${dictionarySchema.description}</p>
    <details>
      <summary>
        <h2>Group by first letter</h2>
      </summary>
      ${buildGroupHTML(byLetter)}
    </details>

    <details>
      <summary>
        <h2>Group by tag</h2>
      </summary>
      ${buildGroupHTML(byTag)}
    </details>
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

function groupByLetter (dict) {
  return Object.keys(dict).reduce((byLetter, word) => {
    const firstLetter = word.charAt(0).toLocaleUpperCase()
    const letterList = byLetter[firstLetter]

    if (letterList && letterList.length > 0) {
      letterList.push({ word })
    } else {
      byLetter[firstLetter] = [{ word }]
    }

    return byLetter
  }, {})
}

function groupByTag (dict) {
  const byTag = {}

  for(const word in dict) {
    dict[word].forEach((entry, index) => {
      entry.tags.forEach((tag) => {
        const tagList = byTag[tag]

        if(tagList && tagList.length > 0) {
          tagList.push({ word, index })
        } else {
          byTag[tag] = [{ word, index }]
        }
      })
    })
  }

  return byTag
}

function buildGroupHTML (group) {
  const builtGroups = Object.entries(group)
    .sort(([groupA], [groupB]) => groupA.localeCompare(groupB))
    .map(buildGroup)
    .join('\n')

  return `<ul>
  ${builtGroups}
</ul>`
}

function buildGroup ([groupName, groupItems]) {
  const builtItems = groupItems
    .sort((a, b) => {
      const wordCompare = a.word.localeCompare(b.word)

      return wordCompare === 0
        ? a.index - b.index
        : wordCompare;
    })
    .map(buildGroupItem)
    .join('\n')

  return `<li>
  <h3>${groupName}</h3>
  <ul>
    ${builtItems}
  </ul>
</li>`
}

function buildGroupItem (groupItem) {
  const { word, index } = groupItem
  if (index !== undefined) {
    return `<li><a href="${word}#entry-${index}">${word}<sub>${index + 1}</sub></a></li>`
  } else {
    return `<li><a href="${word}">${word}</a></li>`
  }
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