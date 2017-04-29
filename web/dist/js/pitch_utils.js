// Pitch analyzer stuff
var audioContext = null;
var analyser = null;
var mediaStreamSource = null;
var buflen = 1024;
var buffer = new Float32Array( buflen );
var pitchAnalyzer;
var noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
var pitchQueue = new Queue(3);

window.onload = function() {
    audioContext = new AudioContext();
}

// Get user media
function getUserMedia(dictionary, callback) {
    try {
        navigator.getUserMedia = 
            navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia;
        navigator.getUserMedia(dictionary, callback, error);
    } catch (e) {
        alert('getUserMedia threw exception :' + e);
    }
}
function error() {
    alert('Stream generation failed.');
}

function toggleLiveInput() {

  if(state==pause){
    getUserMedia(
        {
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            },
        }, gotStream);
    state = play;
  }
  else{
    state = pause;
  } 
}

function gotStream(stream) {
    // Create an AudioNode from the stream.
    mediaStreamSource = audioContext.createMediaStreamSource(stream);

    // Connect it to the destination.
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    mediaStreamSource.connect( analyser );

    /* Create a new pitch detector */
    pitchAnalyzer = new PitchAnalyzer();
}

function updatePitch(explorer) {
    analyser.getFloatTimeDomainData( buffer );

    // Use FFT, it's better
    pitchAnalyzer.input(buffer);
    pitchAnalyzer.process();

    var tone = pitchAnalyzer.findTone();
    var pitch = -1;
    if(tone != null){
        pitch = tone.freq;
        var note = noteFromPitch(tone.freq);
        var cents = centsOffFromPitch(tone.freq, note)
    }

    if (pitch == -1) {
        explorer.vy = 0;
    } else {
        pitchQueue.add(pitch);
        // console.log(pitchQueue.array);
        var avg = pitchQueue.average();
        console.log(pitch+' '+avg);
        var min = 150;
        var max = 250;
        // Get a real ratio with no boundaries
        var realRatio = (avg - min) / (max - min);
        // Bound the ratio between 0 and 1, then substract 0.5 to make it move around 0
        var ratio = - (Math.max(0,Math.min(realRatio, 1)) - 0.5);
        // Convert it to a velocity;
        explorer.vy = 10 * ratio;
    }
}

function noteFromPitch( frequency ) {
    var noteNum = 12 * (Math.log( frequency / 440 )/Math.log(2) );
    return Math.round( noteNum ) + 69;
}

function frequencyFromNoteNumber( note ) {
    return 440 * Math.pow(2,(note-69)/12);
}

function centsOffFromPitch( frequency, note ) {
    return Math.floor( 1200 * Math.log( frequency / frequencyFromNoteNumber( note ))/Math.log(2) );
}