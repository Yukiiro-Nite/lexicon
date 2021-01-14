jsonFile.addEventListener('change', loadDictionary)
createDictionaryForm.addEventListener('submit', createDictionary)

function loadDictionary (changeEvent) {
  console.log("load dictionary")

  const files = Array.from(changeEvent.target.files)
  const file = files[0]
  var reader = new FileReader()

  reader.onload = function(loadEvent) {
    const rawText = loadEvent.target.result

    try {
      const json = JSON.parse(rawText)
      const editor = new Editor(json)
      editor.show()
    } catch (jsonParseError) {
      console.error('Problem loading file', jsonParseError)
      // TODO: show an invalid dictionary error
    }
  };

  reader.readAsText(file)
}

function createDictionary (submitEvent) {
  submitEvent.preventDefault()

  const emptyDictionary = {
    name: submitEvent.target.elements.name.value,
    description: submitEvent.target.elements.description.value,
    dictionary: {}
  }

  const editor = new Editor(json)
  editor.show()
}

function goToEditor(json) {
  console.log(json)
  if(isValidDictionary(json)) {
    populateEditor(json)
    showEditor()
  } else {
    // TODO: show an invalid dictionary error
  }
}

function isValidDictionary(json) {

}