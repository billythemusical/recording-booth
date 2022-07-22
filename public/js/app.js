// import { get, set, entries } from '../node_modules/idb-keyval/dist/index.js'
// Only do this if you wanna clear all of the database (!!!)
// import { clear } from '/node_modules/idb-keyval/dist/index.js'

//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL

// function testLocalStorage() {
// 	set( 'hello', 'world' )
// 		.then( e => console.log( 'set is working' ) )
// 	get( 'hello' )
// 		.then( e => console.log( 'get is working too,', e ) )
// }
//
// function printEntries() {
// 	entries()
// 		.then( e => {
// 			console.log( 'printing the idb data store' )
// 			e.forEach( f => console.log( f ) )
// 		} )
// }

// This will test and print the items saved locally
// testLocalStorage()
// printEntries()

// This will clear all the items saved locally (!!!)
/*
function clearLocalStorage() {
	clear()
}
// clearLocalStorage()
*/

let gumStream // Stream from getUserMedia()
let rec // Recorder.js object
let input // MediaStreamAudioSourceNode we'll be recording
let ourBlob // Blob data from recording to display and upload
let fileName // Name to call the recording
let startTime
let ellipses = ""
let ellipsesTimeoutID
let cancelElipses

// shim for AudioContext when it's not avb.
const AudioContext = window.AudioContext || window.webkitAudioContext
let audioContext //audio context to help us record

const submissionForm = document.getElementById( "submissionForm" )
const thanksReset = document.getElementById( "thanksReset" )
const recordButton = document.getElementById( "recordButton" )
const stopButton = document.getElementById( "stopButton" )
const submitButton = document.getElementById( "submitButton" )
const redoButton = document.getElementById( "redoButton" )
const recordingsList = document.getElementById( "recordingsList" )
const elapsedTime = document.getElementById( "elapsedTime" )
// const termsPopup = document.getElementById( "termsPopup" )
// const termsLanguage = document.getElementById( "termsLanguage")
const modal = document.getElementById( "modal" )
const waitingToUpload = document.getElementById( "waitingToUpload")
const waiting = document.getElementById( "waiting")
const uploadUnsuccessful = document.getElementById( "uploadUnsuccessful")
const acceptTerms = document.getElementById( "acceptTerms" )
// const confirmButton = document.getElementById( "confirmButton" )
// const cancelButton = document.getElementById( "cancelButton" )
// const close = document.getElementById( "close" )
const form = document.getElementById( "form" )

//add events to buttons
recordButton.addEventListener( "click", startRecording )
stopButton.addEventListener( "click", stopRecording )
submitButton.addEventListener("click", uploadRecording )
// cancelButton.addEventListener( "click", cancelSubmission )
redoButton.addEventListener( "click", confirmRedo )
// close.addEventListener( "click", cancelSubmission )

// Must be checked to Submit recording
acceptTerms.addEventListener( 'change', toggleCheck )


async function startRecording() {
	console.log( "recordButton clicked" )

	/*
		For more advanced audio features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/

	const constraints = {
		video: false,
		audio: {
			autoGainControl: true, // seems to make it mono if true
			echoCancellation: false,
			noiseSupression: false,
		}
	}

	/*
    	Disable the record button until we get a success or fail from getUserMedia()
	*/

	recordButton.disabled = true
	stopButton.disabled = false
	submitButton.disabled = true
	redoButton.disabled = true

	/*
    	We're using the standard promise based getUserMedia()
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/

	try {

		await navigator.mediaDevices.getUserMedia( constraints ).then( function( stream ) {
			console.log( "getUserMedia() success, stream created, initializing Recorder.js ..." )

			/*
				create an audio context after getUserMedia is called
				sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
				the sampleRate defaults to the one set in your OS for your playback device

			*/
			audioContext = new AudioContext()
			startTime = new Date().getTime()

			/*  assign to gumStream for later use  */
			gumStream = stream

			/* use the stream */
			input = audioContext.createMediaStreamSource( stream )

			/*
				Create the Recorder object and configure to record mono sound (1 channel)
				Recording 2 channels  will double the file size
			*/
			rec = new Recorder( input, {
				numChannels: 1
			} )

			//start the recording process
			rec.record()

			updateRecordingTime()

			console.log( "Recording started" )

		})

	} catch(err) {
		console.log('getUserMedia failed:', err)
		alert("You must allow access to the microphone to record audio. Please try again.")

		//enable the record button if getUserMedia() fails
		recordButton.disabled = false
		stopButton.disabled = true
		submitButton.disabled = true
		redoButton.disabled = true
	}
}

function updateRecordingTime() {
	if (rec.recording) {
		const currentTime = (new Date().getTime()) - startTime
		const minutes = Math.floor(currentTime / 60000);
		const secondsFix = ((currentTime % 60000) / 1000).toFixed(0) - 1;
		const seconds = secondsFix >= 0 ? secondsFix : 0

		const formattedTime = seconds == 60 ?
			( minutes + 1 ) + ":00" :
  		minutes + ":" + (seconds < 10 ? "0" : "") + seconds

		elapsedTime.innerHTML = formattedTime;
		setTimeout(updateRecordingTime, 100)
	}
}

function stopRecording() {
	console.log( "stopButton clicked" )

	//disable the stop button, enable the record too allow for new recordings
	stopButton.disabled = true
	recordButton.disabled = true
	// submitButton.disabled = false
	redoButton.disabled = false

	//reset button just in case the recording is stopped while paused
	// submitButton.innerHTML="Pause"

	//tell the recorder to stop the recording
	rec.stop()

	//stop microphone access
	gumStream.getAudioTracks()[ 0 ].stop()

	//create the wav blob and pass it on to createDownloadLink
	rec.exportWAV( createDownloadLink )

}

function createDownloadLink( blob ) {

	ourBlob = blob

	let url = URL.createObjectURL( blob )
	let au = document.createElement( 'audio' )
	let span = document.createElement( 'span' )
	let link = document.createElement( 'a' )

	//name of .wav file to use during upload and download (without extendion)
	fileName = new Date().toISOString()

	//add controls to the <audio> element
	au.controls = true
	au.style.position = "relative"
	au.style.display = "inline"
	au.style.verticalAlign = "bottom"
	au.style.width = "300px"
	// au.style.top = "10px"
	au.style.left = "20px"

	au.src = url

	//add the li element to the ol
	recordingsList.appendChild( au );

}

function cancelSubmission() {
	// termsPopup.style.display = "none"
	redoButton.disabled = false
}

function resetForm() {
	// Reset all inputs
	form.reset()
	acceptTerms.checked = false
	// Hide the thanks page
	thanksReset.style.display = "none"
	// And show the submission form
	submissionForm.style.display = "block"

}

function saveRecordingLocally(filename, blob) {

	// create a URL for tracking down the file later?
	// let url = URL.createObjectURL( blob )

	// // also save to local storage using idb keyval
	// var saveObj = {
	// 	blob: blob,
	// 	url: url
	// }
	// set( ( filename + ".wav" ), saveObj )
	// 	.then( () => console.log( "set", filename + ".wav", saveObj ) )
}

async function uploadRecording() {

	// if recording...
	if (!rec) {
		alert('Please make a recording first.')
		return
	} else if (rec.recording) {
		rec.stop()
		stopButton.disabled = true
		recordButton.disabled = true
		redoButton.disabled = false
	}

	const acceptedTerms = document.getElementById('acceptTerms').checked
	console.log(acceptedTerms)
	if ( !acceptedTerms ) {
		alert( "Please accept our terms and conditions before confirming." )
		return
	}

	// Tell the user we are uploading their recording, waiting...
	showModal()

	// Save the recording locally before trying to upload
	saveRecordingLocally(fileName, ourBlob)
	// TO DO: Delete local recording if user so chooses...

	// Get the user input
	let name = document.getElementById( 'name' ).value
	name = name ? name : "blank" // hacks on hacks on hacks on...
	let email = document.getElementById( 'email' ).value
	email = email ? email : "blank" // hacks on hacks on hacks on...
	let phone = document.getElementById( 'phone' ).value
	phone = phone ? phone.replace(/[^\w\s\']|_/g, "").replace(/\s+/g, " ") : "blank" // hacks on hacks on hacks on...
	let age = document.getElementById( 'age' ).value
	age = age ? age : "blank" // hacks on hacks on hacks on...
	let location = document.getElementById( 'location' ).value
	location = location ? location : "blank" // hacks on hacks on hacks on...
	const date= new Date().toLocaleString();
	const association = getAssoc()
	const accepted = acceptTerms.checked
	console.log(`got contact info:\n${name}\n${email}\n${phone}\n${age}\n${location}\n${association}\n${accepted}`)


	const fd = new FormData()
	fd.append( 'username', name )
	fd.append( 'email', email )
	fd.append( 'phone', phone )
	fd.append( 'age', age )
	fd.append( 'location', location )
	fd.append( 'date', date)
	fd.append( 'association', association )
	fd.append( 'termsAccepted', accepted )
	fd.append( 'fileName', fileName + ".wav" )
	fd.append( 'file', ourBlob )

	// fetch( 'http://127.0.0.1:3000/upload', { // for development
	async function upload() {
		return fetch( '/upload', {
			method: 'post',
			// mode: 'no-cors', // when not working locally
			body: fd,
		})
		.then( res => {
			if (!res.ok) {
				throw new ERROR(`HTTP Upload Error: ${response.status}`)
			}
			return res
		})
		.catch( error => console.error(`Fetch problem: ${error.message}`))
	}

	const success = await Promise.all([ upload(), sleep(5000) ])
		.then( promises => {

			const uploadResponse = promises[0]

			if(!uploadResponse.ok) { // if the upload is unsuccessful

				waitingToUpload.style.display = "none"
				uploadUnsuccessful.style.display = "block"

			} else { // if the upload was successful

				clearTimeout(ellipsesTimeoutID)
				console.log(`cleared timeout: ${ellipsesTimeoutID}`)

				showThanks()

				// setTimeout(redoRecording, 10000)
				setTimeout(reloadPage, 10000)


			}
		})
		.catch(error => console.log('Error handling upload:', error))

		return "success"
}

function toggleCheck() {
	// console.log( "acceptTerms element\n", acceptTerms )
	if ( acceptTerms.checked == true ) {
		// console.log( 'checked acceptTerms' );
		submitButton.disabled = false
	} else {
		// console.log( 'does not acceptTerms' );
		submitButton.disabled = true
	}
}

function confirmRedo() {

	const ask = "Are you sure?  This will erase the current recording."
	const answer = confirm( ask ) ? "yes" : "no"

	if ( answer == "yes" ) {
		redoRecording()
	} else {
		return
	}
}

function redoRecording() {

	// Just reload the page, why not?
	// location.reload()

	// //clear the recording and reset the buttons
	recordButton.disabled = false
	stopButton.disabled = true
	submitButton.disabled = true
	redoButton.disabled = true
	acceptTerms.checked = false

	//Hide the Thank you page
	thanksReset.style.display = "none"
	// Show the submission form
	submissionForm.style.display = "block"


	// Stop the recording if you haven't already
	if ( rec.recording ) rec.stop()
	// Reset the recording - we'll create a new one later
	rec = null
	// Delete the saved recording elements
	recordingsList.innerHTML = ""
	// Reset the elapsed time counter
	elapsedTime.innerHTML = "0:00"
	// Hide the latest message
	hideModal()

}

async function showModal() {
	await sleep(1000)
	cancelElipses = waitingEllipses()
	modal.style.display = "block"
	waitingToUpload.style.display = "block"
}

function hideModal() {
	clearTimeout(cancelElipses)
	modal.style.display = "none"
	uploadUnsuccessful.style.display = "none"
	waitingToUpload.style.display = "block"
}

function waitingEllipses() {
	if (ellipses.length >= 3) {
		ellipses = ""
	}
	ellipses += "."
	waiting.innerHTML = ellipses
	ellipsesTimeoutID = setTimeout(waitingEllipses, 500)
}

// Get the asscotiation from the radio button selection
function getAssoc () {
	let associations = document.getElementsByName("association");
	let association;
	associations.forEach(a => {
		if (a.checked) {
			console.log(`ran getAssoc(): ${a.value}`)
			association = a.value
		} else {
			association = null
		}
	})
	return association
}

function showThanks() {
	form.reset()
	thanksReset.style.display = "block"
	submissionForm.style.display = "none"
	window.scrollTo({
		top: 0,
		left: 0,
		behavior: 'smooth'
	});
}

function reloadPage() {
	location.reload()
}

// A sleep function
const sleep = ms => new Promise(r => setTimeout(r, ms));
