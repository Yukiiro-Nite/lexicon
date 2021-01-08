function buildViewFiles (dictionarySchema, indexStyle = '', wordPageStyle = '') {
  const pages = buildWordPages(dictionarySchema, wordPageStyle)
  const indexPage = { fileName: 'index.html', content: buildIndexPage(dictionarySchema, indexStyle) }

  pages.push(indexPage)

  return pages
}

function buildWordPages (dictionarySchema, wordPageStyle) {
  return Object.entries(dictionarySchema.dictionary)
    .map(([key, dictionaryEntries]) => ({
      fileName: `${toSafeName(key)}.html`,
      content: buildWordPage(key, dictionaryEntries, dictionarySchema.name, wordPageStyle)
    }))
}

function buildIndexPage (dictionarySchema, indexStyle) {
  const byLetter = groupByLetter(dictionarySchema.dictionary)
  const byTag = groupByTag(dictionarySchema.dictionary)

  return `<html>
  <head>
    <title>${dictionarySchema.name}</title>
    <style>
      ${indexStyle}
    </style>
  </head>
  <body>
    <h1 class="dictionary-name">${dictionarySchema.name}</h1>
    <p class="dictionary-description">${dictionarySchema.description}</p>
    <article>
      <h2>Group by first letter</h2>
      ${buildGroupHTML(byLetter)}
    </article>

    <article>
      <h2>Group by tag</h2>
      ${buildGroupHTML(byTag)}
    </article>
  </body>
</html>
`
}

function toSafeName (name) {
  // TODO: return a safe file / path / url name here...
  return name
}

function buildWordPage (word, entries, dictionaryName, wordPageStyle) {
  const builtEntries = entries.map(buildEntry).join('\n')
  const firstLetter = word.charAt(0).toLocaleUpperCase()

  return `<html>
  <head>
    <title>${dictionaryName} - ${word}</title>
    <style>
      ${wordPageStyle}
    </style>
  </head>
  <body>
    <h1>${word}</h1>
    <nav>
      <ol>
        <li><a href="index">Back to index</a></li>
        <li><a href="index#group-${firstLetter}">Words that start with ${firstLetter}</a></li>
      </ol>
    </nav>
    <ol>
      ${builtEntries}
    </ol>
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
  <h3 id="group-${groupName}">${groupName}</h3>
  <ul>
    ${builtItems}
  </ul>
</li>`
}

function buildGroupItem (groupItem) {
  const { word, index } = groupItem
  if (index !== undefined) {
    return `<li><a href="${word}#entry-${index + 1}">${word}<sub>${index + 1}</sub></a></li>`
  } else {
    return `<li><a href="${word}">${word}</a></li>`
  }
}

function buildEntry (entry, index) {
  return `<li id="entry-${index + 1}">
  <p class="definition">${entry.definition}</p>
  ${buildTags(entry.tags)}
  ${buildRelationships(entry.relationships)}
</li>`
}

function buildTags (tags) {
  if(!tags || !tags.length) return '';

  const builtTags = tags
    .map(tag => `<li><a href="index#group-${tag}">${tag}</a></li>`)
    .join('\n')

  return `<h3>Tags</h3>
<ul class="tags">
  ${builtTags}
</ul>`
}

function buildRelationships (relationships) {
  if(!relationships || !relationships.length) return '';

  const builtRelationships = relationships
    .map((relationship) => {
      const [word, index] = relationship.link
      return `<li><a href="${word}#entry-${index + 1}">${word} - ${relationship.description}</a></li>`
    })
    .join('\n')
  
  return `<h3>Relationships</h3>
<ul class="relationships">
  ${builtRelationships}
</ul>`
}


// ================================================================================================
// stuff for using this script with node.
if(require && module) {
  function buildViewCLI () {
    const {
      jsonPath,
      outputPath,
      indexStyle,
      wordStyle
    } = getAndVerifyArgs(process.argv.slice(2))
  
    const dictionaryJson = require(jsonPath)
    const files = buildViewFiles(dictionaryJson, indexStyle, wordStyle)
  
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

  function getAndVerifyArgs (args) {
    const fs = require('fs')
    const path = require('path')
    const yargsParser = require('yargs-parser')
    const rawOptions = yargsParser(args)
    const verifiedOptions = {}

    // process json schema path
    if (rawOptions._.length === 0) {
      console.error("dictionary schema json file is required. eg: node view-builder.js example/sample-dictionary.json")
      process.exit(1)
    } else {
      const jsonPath = path.resolve(process.cwd(), rawOptions._[0])
      const pathExists = fs.existsSync(jsonPath)
      
      if (!pathExists) {
        console.log(`${jsonPath} does not exist, please provide a valid path.`)
        process.exit(1)
      } else {
        verifiedOptions.jsonPath = jsonPath
      }
    }

    // process output path
    if (!rawOptions.o) {
      console.log("No output set with -o, defaulting to current folder.")
      verifiedOptions.outputPath = process.cwd()
    } else {
      const outputPath = path.resolve(process.cwd(), rawOptions.o)
      const pathExists = fs.existsSync(outputPath)

      if (!pathExists) {
        console.log(`${outputPath} does not exist, please make sure it exists first.`)
        process.exit(1)
      } else {
        verifiedOptions.outputPath = outputPath
      }
    }

    // process index style
    if (!rawOptions.indexStyle) {
      console.log("No input style path set with --indexStyle, defaulting to no style")
      verifiedOptions.indexStyle = ''
    } else {
      const indexStylePath = path.resolve(process.cwd(), rawOptions.indexStyle)
      const pathExists = fs.existsSync(indexStylePath)

      if (!pathExists) {
        console.log(`${indexStylePath} does not exist, please make sure it exists first.`)
        process.exit(1)
      } else {
        verifiedOptions.indexStyle = fs.readFileSync(indexStylePath)
      }
    }

    // process word style
    if (!rawOptions.wordStyle) {
      console.log("No input style path set with --wordStyle, defaulting to no style")
      verifiedOptions.wordStyle = ''
    } else {
      const wordStylePath = path.resolve(process.cwd(), rawOptions.wordStyle)
      const pathExists = fs.existsSync(wordStylePath)

      if (!pathExists) {
        console.log(`${wordStylePath} does not exist, please make sure it exists first.`)
        process.exit(1)
      } else {
        verifiedOptions.wordStyle = fs.readFileSync(wordStylePath)
      }
    }

    return verifiedOptions
  }
  
  if (require.main === module) {
    buildViewCLI()
  }

  module.exports = {
    buildViewFiles,
    exportViewToFolder
  }
}