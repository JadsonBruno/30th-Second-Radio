let context = AudioContext || webkitAudioContext;
let audioContext = new context();
let audio = document.querySelector("#audio");
let arrayAudios = [];
let countMusic = 1;

// handle api music
function playMusic(track, title) {
  let musicName = document.querySelector("#musicName");
  musicName.innerHTML = "Tocando " + title;
  if (countMusic < arrayAudios.length) {
    countMusic =
      (arrayAudios.findIndex(m => m.url === track) + 1) % arrayAudios.length;
  }
  audio.setAttribute("src", track);
}

audio.addEventListener("ended", () => {
  playMusic(arrayAudios[countMusic].url, arrayAudios[countMusic].title);
  audio.currentTime = 0;
});

function showInfo(data) {
  let listElement = document.getElementById("listInfo");
  listElement.innerHTML = "";
  let artistElement = document.getElementById("artistInfo");
  let wavesElement = document.getElementById("waves-frequency");
  let imageElement = document.getElementById("albumImage");

  wavesElement.style.display = "";
  artistElement.innerHTML = "Artista:  " + data[0].artist.name;

  imageElement.setAttribute("src", data[0].album.cover);

  data.forEach(music => {
    let nameElement = document.createElement("li");
    let nameText = document.createTextNode("Música: " + music.title);
    nameElement.appendChild(nameText);

    let btnPlay = document.createElement("button");
    btnPlay.setAttribute(
      "onclick",
      `playMusic("${music.preview}", "${music.title}")`
    );
    btnPlay.innerHTML = "Play Demo";

    listElement.appendChild(nameElement);
    listElement.appendChild(btnPlay);

    let obj = { url: music.preview, title: music.title };
    arrayAudios.push(obj);
  });
}

function findMusic() {
  let artistName = document.querySelector("#artist");
  if (artistName.value !== "" && artistName !== undefined) {
    axios({
      method: "GET",
      url: "https://deezerdevs-deezer.p.rapidapi.com/search",
      headers: {
        "content-type": "application/octet-stream",
        "x-rapidapi-host": "deezerdevs-deezer.p.rapidapi.com",
        "x-rapidapi-key": "c3fcf17bf0msh6079e8466823638p139214jsnc29e6d3e2127"
      },
      params: {
        q: artistName.value
      }
    })
      .then(response => {
        let track = response.data.data[0].preview;
        let title = response.data.data[0].title;
        arrayAudios = [];
        playMusic(track, title);
        showInfo(response.data.data);
      })
      .catch(error => {
        musicName.innerHTML = "Artista não encontrado";
        console.log(error);
      });
  } else {
    musicName.innerHTML = "Campo de busca vazio!";
  }
}
//end handle api music
//swing control
audio.onplay = e => {
  audioContext.resume();
};

let swing = document.querySelector("#balanco");
let media = audioContext.createMediaElementSource(audio);
let swingControle = audioContext.createStereoPanner();
media.connect(swingControle);
swingControle.connect(audioContext.destination);

swing.oninput = e => {
  swingControle.pan.value = e.target.value;
};
//end swing control
//Generate Frequency
let canvas = document.querySelector("#canvas");
let width = canvas.width;
let height = canvas.height;
let canvasContext = canvas.getContext("2d");
let analyser = audioContext.createAnalyser();

analyser.fftSize = 2048;
let bufferLength = analyser.frequencyBinCount;
let dataArray = new Uint8Array(bufferLength);

let sliceWidth = (width * 1.0) / bufferLength;

media.connect(analyser);
analyser.connect(audioContext.destination);

requestAnimationFrame(visualize);

function visualize() {
  canvasContext.clearRect(0, 0, width, height);
  canvasContext.fillStyle = "rgb(47,47,47)";

  canvasContext.lineWidth = 2;
  canvasContext.strokeStyle = "rgb(255,255,255)";
  canvasContext.shadowOffsetX = 1;
  canvasContext.shadowOffsetY = 1;
  canvasContext.shadowBlur = 10;
  canvasContext.shadowColor = "rgb(220,220,220)";
}

function draw() {
  loopDraw = requestAnimationFrame(draw);

  analyser.getByteTimeDomainData(dataArray);

  canvasContext.fillRect(0, 0, width, height);
  canvasContext.beginPath();

  let x = 0;
  for (let i = 0; i < bufferLength; i++) {
    let v = dataArray[i] / 255.0;
    let y = (v * height) / 2;
    if (i === 0) {
      canvasContext.moveTo(x, y);
    } else {
      canvasContext.lineTo(x, y);
    }
    x += sliceWidth;
  }

  canvasContext.lineTo(canvas.width, canvas.height / 2);
  canvasContext.stroke();
}

function draw2() {
  let canvas2 = document.querySelector("#canvas2");
  let canvasContext2 = canvas2.getContext("2d");

  // let media2 = audioContext.createMediaElementSource(audio);
  let analyser2 = analyser;
  analyser2.fftSize = 1024;
  let bufferLength2 = analyser2.frequencyBinCount;
  let dataArray2 = new Uint8Array(bufferLength);

  // media2.connect(analyser2);
  analyser2.connect(audioContext.destination);

  requestAnimationFrame(draw2);

  canvasContext2.fillStyle = "rgb(47,47,47)";
  var width = canvas2.width;
  var height = canvas2.height;
  canvasContext2.fillRect(0, 0, width, height);

  analyser2.getByteFrequencyData(dataArray2);
  var x = 0;
  var barWidth = width / bufferLength2;

  for (var i = 0; i < bufferLength2; i++) {
    var v = dataArray2[i] / 255;
    var y = v * (height / 1.2);
    canvasContext2.fillStyle = "rgb(" + (y + 255) + ",255,255)";
    canvasContext2.fillRect(x, height - y, barWidth, y);
    x += barWidth + 1;
  }
}

draw();
draw2();
// end generate frequency
