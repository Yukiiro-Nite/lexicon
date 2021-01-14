class Editor {
  constructor (json) {
    this.data = json
    const isValid = this.isDataValid(this.data)

    if(isValid) {
      this.show()
    } else {
      // show error in ui.
    }
  }

  isDataValid (data) {
    const hasName = data.name !== undefined
    const hasDescription = data.description !== undefined
    const hasDictionary = typeof data.dictionary === 'object' && data.dictionary !== null
    const isEmptyDictionary = hasDictionary && Object.entries(data.dictionary).length === 0
    const hasValidEntries = hasDictionary && (
      isEmptyDictionary
      || Object.entries(data.dictionary).every(([key, entries]) => this.isValidEntry(data.dictionary, key, entries))
    )

    return hasName
      && hasDescription
      && hasDescription
      && hasValidEntries
  }

  isValidEntry (dict, key, entries) {
    return entries
      && entries.length !== undefined
      && entries.every(entry => {
        return key === entry.word
          && entry.definition
          && Array.isArray(entry.tags)
          && Array.isArray(entry.relationships)
          && (
            entry.relationships.length === 0
              || entry.relationships.every((relationship) => this.isValidRelationship(dict, relationship))
          )
      })
  }

  isValidRelationship (dict, relationship) {
    return Array.isArray(relationship.link)
      && relationship.link.length === 2
      && Boolean(dict[relationship.link[0]])
      && Boolean(dict[relationship.link[0]][relationship.link[1]])
      && relationship.description
  }

  show () {

  }
}