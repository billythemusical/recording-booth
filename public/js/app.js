import {
	get,
	set,
	entries
} from '/node_modules/idb-keyval/dist/index.js'
// Only do this if you wanna clear all of the database (!!!)
// import { clear } from '/node_modules/idb-keyval/dist/index.js'

//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL

function testLocalStorage() {
	set( 'hello', 'world' )
		.then( e => console.log( 'set is working' ) )
	get( 'hello' )
		.then( e => console.log( 'get is working too,', e ) )
}

function printEntries() {
	entries()
		.then( e => {
			console.log( 'printing the idb data store' )
			e.forEach( f => console.log( f ) )
		} )
}

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

// shim for AudioContext when it's not avb.
const AudioContext = window.AudioContext || window.webkitAudioContext
let audioContext //audio context to help us record

const recordButton = document.getElementById( "recordButton" )
const stopButton = document.getElementById( "stopButton" )
const submitButton = document.getElementById( "submitButton" )
const redoButton = document.getElementById( "redoButton" )
const recordingsList = document.getElementById( "recordingsList" )
const elapsedTime = document.getElementById( "elapsedTime" )
const termsPopup = document.getElementById( "termsPopup" )
const termsLanguage = document.getElementById( "termsLanguage")
const thanksReset = document.getElementById( "thanksReset")
const agree = document.getElementById( "agree" )
const confirmButton = document.getElementById( "confirmButton" )
const cancelButton = document.getElementById( "cancelButton" )
const close = document.getElementById( "close" )

//add events to buttons
recordButton.addEventListener( "click", startRecording )
stopButton.addEventListener( "click", stopRecording )
submitButton.addEventListener( "click", confirmSubmission )
confirmButton.addEventListener( "click", uploadRecording )
cancelButton.addEventListener( "click", cancelSubmission )
redoButton.addEventListener( "click", confirmRedo )
close.addEventListener( "click", cancelSubmission )

// Must be checked to Submit recording
agree.addEventListener( 'change', toggleCheck )

function startRecording() {
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

	navigator.mediaDevices.getUserMedia( constraints ).then( function( stream ) {
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

	} ).catch( function( err ) {
		console.log(err)
		//enable the record button if getUserMedia() fails
		recordButton.disabled = false
		stopButton.disabled = true
		submitButton.disabled = true
		redoButton.disabled = true
	} )
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
	submitButton.disabled = false
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
	let li = document.createElement( 'li' )
	let link = document.createElement( 'a' )

	//name of .wav file to use during upload and download (without extendion)
	fileName = new Date().toISOString()

	//add controls to the <audio> element
	au.controls = true
	au.src = url

	//add the new audio element to li
	li.appendChild( au )

	//add the filename to the li
	li.appendChild( document.createTextNode( fileName + ".wav " ) )

	//add the save to disk link to li
	// li.appendChild(link)

	//add the li element to the ol
	recordingsList.appendChild( li );

}

function confirmSubmission() {

	// if recording...
	if ( rec.recording ) {
		rec.stop()
		stopButton.disabled = true
		recordButton.disabled = true
		redoButton.disabled = false
	}

	termsPopup.style.display = "block"
	resetTerms()
}

function cancelSubmission() {
	resetTerms()
	termsPopup.style.display = "none"
	redoButton.disabled = false
}

function resetTerms() {
	termsLanguage.style.display = "block"
	thanksReset.style.display = "none"
	confirmButton.disabled = true
	agree.checked = false
}

function saveRecordingLocally(filename, blob) {

	// create a URL for tracking down the file later?
	let url = URL.createObjectURL( blob )

	// also save to local storage using idb keyval
	var saveObj = {
		blob: blob,
		url: url
	}
	set( ( filename + ".wav" ), saveObj )
		.then( () => console.log( "set", filename + ".wav", saveObj ) )
}

function uploadRecording() {

	if ( agree.checked == false ) {
		alert( "Please accept the terms and conditions before confirming." )
		return
	}

	saveRecordingLocally(fileName, ourBlob)

	let name = document.getElementById( 'name' ).value
	name = name ? name : "blank" // hacks on hacks on hacks on...
	let email = document.getElementById( 'email' ).value
	email = email ? email : "blank" // hacks on hacks on hacks on...
	let agreed = agree.checked
	console.log( 'got name and email:', name, email )
	console.log( 'did they accept the TOS?', agreed )

	var fd = new FormData()
	fd.append( 'username', name )
	fd.append( 'email', email )
	fd.append( 'agreed to terms', agreed )
	fd.append( 'fileName', fileName + ".wav" )
	fd.append( 'file', ourBlob )

	fetch( 'http://127.0.0.1:3000/upload', {
			method: 'post',
			mode: 'no-cors',
			body: fd,
		} )
		.then( res => {
			console.log( res )
			termsLanguage.style.display = "none"
			thanksReset.style.display = "block"
			setTimeout(redoRecording, 5000)
		})
		.catch( error => ( 'Error occured', error ) )
}

function toggleCheck() {
	console.log( "agree element\n", agree )
	if ( agree.checked == true ) {
		console.log( 'checked agree' );
		confirmButton.disabled = false
	} else {
		console.log( 'does not agree' );
		confirmButton.disabled = true
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
	//clear the recording and reset the buttons
	recordButton.disabled = false
	stopButton.disabled = true
	submitButton.disabled = true
	redoButton.disabled = true

	// Stop the recording if you haven't already
	if ( rec.recording ) rec.stop()
	// Reset the recording - we'll create a new one later
	rec = null
	// Delete the saved recording elements
	recordingsList.innerHTML = ""
	// Hide the termsPopup if it is shown
	termsPopup.style.display = "none"
	// Reset the elapsed time counter
	elapsedTime.innerHTML = "0:00"


}

window.onclick = function( event ) {
	if ( event.target == termsPopup ) {
		termsPopup.style.display = "none"
	}
}
