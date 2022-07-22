const clientDeleteFile = async function (el) {

    console.log('trying to delete', el.value)
    // Don't let the link do anything
    el.preventDefault()

    // Get the value which is the file to be deleted
    const referenceFileName = el.value
    console.log('Going to try to delete this file', referenceFileName)

    // Fetch from the server with the delete method
    const options = {
        method: 'delete',
        body: { "referenceFileName": referenceFileName },
      }

    await fetch( '/delete', options )
        .then( res => {
          el.innerHTML = "This file has been deleted."
        })
        .catch( error => {
          console.log("ERROR: Unable to fetch and delete the file.", res.status)
        })
  }

module.exports = { clientDeleteFile: clientDeleteFile }
