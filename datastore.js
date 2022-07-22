// Database to store data, don't forget autoload: true
const Datastore = require( 'nedb-promises' )
const db = Datastore.create( {
	filename: "datastore.db",
	autoload: true
} );

const getData = async ( target = {} ) => {

	console.log( 'waiting for data from datastore.js > getData()' )

  return await db.find( target )
    .then(docs => {
    	console.log( `There are ${docs.length} documents already in the database.` )
      return docs
    })
    .catch (error => {
      console.log("ERROR: There was an error getting the docs from the database:", error)
      return null
    })
}

const addData = async ( data ) => {

	try {
		await db.insert( data, ( err, docs ) => {

			console.log( "db.insert() ran" );

			if ( err ) {
				console.log( "and had an error: ", err );
				return err
			}

			console.log( " and has newDocs:", JSON.stringify( docs ) );
		} );

		return true

	} catch ( error ) {
		console.log( 'ERROR ADDING DATA:', error )
		return false
	}

}

const deleteData = async ( data, multiple = {} ) => {

	try {

		console.log( "Trying to remove data" )

		await db.remove( data, multiple, ( error, success ) => {

			console.log( "Successfully deleted data", data )

			return success

	   } )
	} catch ( error ) {

		console.log( "Unable to delete data:", error )

	}

	// compactData will be true or false
	return await compactData()
}


async function compactData() {

	try {
		// Compact the database to remove any previously deleted data
		await db.compactDatafile()

    console.log("DATA has been refreshed/compacted.")

		return true

	} catch ( error ) {

		console.log( "ERROR COMPACTING DATA:", error )

		return false
	}

}

module.exports = {
	db: db,
	getData: getData,
	addData: addData,
	deleteData: deleteData,
	// compactData: compactData
}
