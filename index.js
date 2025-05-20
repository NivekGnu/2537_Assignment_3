// Function to fetch a random Pokemon image
function getPokemon() {
  const pokemonID = Math.floor(Math.random() * 1026) + 1;

  return fetch("https://pokeapi.co/api/v2/pokemon/" + pokemonID)
    .then((response) => response.json())
    .then((data) => {
      return data.sprites.front_default
    })
}

// Function to create a card element
function createCard(imgID, imgNo) {
  const card = document.createElement("div");
  const frontFace = document.createElement("img");
  const backFace = document.createElement("img");

  card.classList.add("card");

  frontFace.classList.add("front_face");
  frontFace.src = imgID;
  frontFace.id = `img${imgNo}`;

  backFace.classList.add("back_face");
  backFace.src = "public/img/pokemon_facecard.jpg";

  card.appendChild(frontFace);
  card.appendChild(backFace);

  return card;
}

// Function to get n unique random Pokemon IDs
function getRandomPokemonIds(n) {
  const ids = [];

  while (ids.length < n) {
    const rand = Math.floor(Math.random() * 1026) + 1;
    if (!ids.includes(rand)) {
      ids.push(rand);
    }
  }

  return ids;
}

// Function to shuffle the cards
function shuffleCards(cardPairs) {
  for (let i = cardPairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cardPairs[i], cardPairs[j]] = [cardPairs[j], cardPairs[i]];
  }
}

// Function to generate pairs of Pokemon 
function generatePairs(pairCount) {
  const ids = getRandomPokemonIds(pairCount);

  return Promise.all(ids.map(getPokemon)).then((images) => {
    const duplicated = images.flatMap((img) => [img, img]); // create pairs
    shuffleCards(duplicated); // shuffle the 2n images
    return duplicated;
  });
}

// Function to set up the game
function setup(numPairs, timeLimit) {
  // Game logic
  let firstCard = undefined;
  let secondCard = undefined;
  let lockBoard = false;
  let pairsFound = 0;
  let pairsRemain = 0;
  const totalPairs = numPairs;
  let clickCount = 0;

  // Timer logic
  let seconds = 0;
  const maxTime = timeLimit;
  const difficultyLevels = {
    30: 'Hard',
    45: 'Medium',
    60: 'Easy',
  };

  // Game UI Setup
  const timerElement = document.getElementById("timer");
  const timerBar = document.getElementById("timer-bar");
  timerElement.innerHTML = "Time: 0s";

  document.getElementById("start-container").style.display = "none";
  document.getElementById("game-container").style.display = "flex";

  const numClicks = document.getElementById("click-count");
  const pairsLeft = document.getElementById("pairs-left");
  const pairsMatched = document.getElementById("pairs-matched");
  document.getElementById("total-pairs").innerHTML = `${totalPairs}`;

  document.getElementById("gameLevel").innerHTML = `Lv${difficultyLevels[maxTime]}`;

  // If a timer is already running, clear it
  if (window.gameTime) {
    clearInterval(window.gameTime);
  }

  // Start a new timer
  window.gameTime = setInterval(() => {
    seconds++;
    timerElement.innerHTML = `Time: ${seconds}s`;

    // Update HP bar (percentage left)
    const percent = Math.max(0, ((maxTime - seconds) / maxTime) * 100);
    timerBar.style.width = `${percent}%`;

    // Change colour of bar based on time left
    if (percent < 30) {
      timerBar.style.backgroundColor = "#e53935"; // red
    } else if (percent < 60) {
      timerBar.style.backgroundColor = "#f9a825"; // yellow
    } else {
      timerBar.style.backgroundColor = "#4CAF50"; // green
    }

    // Check if time is up; ends game if yes
    if (seconds >= maxTime) {
      $(".card").off("click");
      clearInterval(window.gameTime);
      document.getElementById("lose-container").style.display = "flex";
      document.getElementById("buttons").style.display = "flex";
    }
  }, 1000);

  generatePairs(numPairs).then((cardPairs) => {
    const container = document.getElementById("game_grid");
    container.innerHTML = ""; // Clear previous cards

    cardPairs.forEach((imgUrl, index) => {
      const card = createCard(imgUrl, index);
      container.appendChild(card);
    });

    $(".card").on(("click"), function () {
      if ($(this).hasClass("flip") || lockBoard) return;

      $(this).toggleClass("flip");

      if (!firstCard) {
        firstCard = $(this).find(".front_face")[0]
        clickCount++;
        numClicks.innerHTML = `${clickCount}`;
      }
      else {
        secondCard = $(this).find(".front_face")[0]
        clickCount++;
        numClicks.innerHTML = `${clickCount}`;
        lockBoard = true;

        // Cards match
        if (
          firstCard.src
          ==
          secondCard.src
        ) {
          $(`#${firstCard.id}`).parent().addClass("matched").parent().off("click")
          $(`#${secondCard.id}`).parent().addClass("matched").parent().off("click")

          firstCard = undefined;
          secondCard = undefined;

          pairsFound++;
          pairsRemain = totalPairs - pairsFound;
          pairsMatched.innerHTML = `${pairsFound}`;
          pairsLeft.innerHTML = `${pairsRemain}`;
          lockBoard = false

          if (pairsFound >= totalPairs / 2) {
            document.getElementById("hint").style.display = "flex";
          }

          if (pairsFound === totalPairs) {
            setTimeout(() => {
              document.getElementById("win-container").style.display = "flex";
              clearInterval(window.gameTime);
            }, 500);
          }
        }
        // Cards don't match 
        else {
          setTimeout(() => {
            $(`#${firstCard.id}`).parent().toggleClass("flip")
            $(`#${secondCard.id}`).parent().toggleClass("flip")

            firstCard = undefined
            secondCard = undefined
            lockBoard = false
          }, 1000)
        }
      }
    });
  });
}

// Reset back to start screen
function resetGame() {
  document.getElementById("game-container").style.display = "none";
  document.getElementById("start-container").style.display = "flex";
  document.getElementById("lose-container").style.display = "none";
  document.getElementById("win-container").style.display = "none";
  clearInterval(window.gameTime);
  seconds = 0;
}

function showHint() {
  const unmatchedCards = document.querySelectorAll('.card:not(.matched)');

  // Flip unmatched cards face up
  unmatchedCards.forEach(card => card.classList.add('flip'));

  // After 2 second, flip them back down
  setTimeout(() => {
    unmatchedCards.forEach(card => card.classList.remove('flip'));
  }, 2000);

  // Disable hint button
  document.getElementById("hint-button").disabled = true;
}